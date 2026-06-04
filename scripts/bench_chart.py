#!/usr/bin/env python3
"""
Benchmark chart data fetching — mirrors EXACTLY what the app does.

For token charts, fetchTokenSample batches per timestamp:
  get_token_price_in_usd("TOKEN")
  get_token_price_in_htr("TOKEN")
  front_end_api_pool("POOL_KEY")          ← one per pool the token is in
  get_token_price_in_usd("TOKEN0")        ← one per pool
  get_token_price_in_htr("TOKEN0")        ← one per pool
  get_reserves("TOKEN0", "TOKEN1", FEE)   ← one per pool

For pool charts, fetchPoolSample batches per timestamp:
  front_end_api_pool("POOL_KEY")
  get_token_price_in_usd("TOKEN_A")
  get_token_price_in_usd("TOKEN_B")

Usage:
  python3 scripts/bench_chart.py \\
    --node https://node.testnet.dozer.finance/v1a \\
    --api-key KEY \\
    --contract CONTRACT_ID \\
    --token TOKEN_UUID          # runs token chart benchmark
    --pool TOKEN_A/TOKEN_B/FEE  # runs pool chart benchmark
    --range 24h --concurrency 5
"""

import argparse, asyncio, math, time
from typing import Optional
import aiohttp

NODE_URL    = "https://node.testnet.dozer.finance/v1a"
API_KEY     = "35c3ba9207bf3a7911ab1003b39dd5d24ec06d5b45f6582a1e66386469288450"
CONTRACT_ID = "00000eecf6a990576c12bfa9e12ee089a5b1ea65e6de1456687ba1f4dc7fd463"

# Mirror constants.ts
INTRA_CANDLE_SAMPLES = 1
CANDLE_INTERVAL_MS = {"24h": 30*60*1000, "3d": 2*60*60*1000, "1w": 4*60*60*1000}
TIME_RANGE_MS      = {"24h": 24*60*60*1000, "3d": 3*24*60*60*1000, "1w": 7*24*60*60*1000}


def token_chart_timestamps(time_range: str = "24h") -> list[int]:
    now_ms = int(time.time() * 1000)
    interval_ms = CANDLE_INTERVAL_MS[time_range]
    candle_count = math.ceil(TIME_RANGE_MS[time_range] / interval_ms)
    end_aligned = math.ceil(now_ms / interval_ms) * interval_ms
    start_ms = end_aligned - candle_count * interval_ms
    seen: set[int] = set()
    result: list[int] = []
    for i in range(candle_count):
        open_ms = start_ms + i * interval_ms
        close_ms = open_ms + interval_ms
        samples = [open_ms]
        for s in range(1, INTRA_CANDLE_SAMPLES + 1):
            samples.append(open_ms + (interval_ms * s) // (INTRA_CANDLE_SAMPLES + 1))
        samples.append(min(close_ms, now_ms))
        for j in range(0 if i == 0 else 1, len(samples)):
            s = min(samples[j], now_ms) // 1000
            if s not in seen:
                seen.add(s)
                result.append(s)
    return result


def pool_chart_timestamps(time_range: str = "24h") -> list[int]:
    now_ms = int(time.time() * 1000)
    interval_ms = CANDLE_INTERVAL_MS[time_range]
    candle_count = math.ceil(TIME_RANGE_MS[time_range] / interval_ms)
    end_aligned = math.ceil(now_ms / interval_ms) * interval_ms
    start_ms = end_aligned - candle_count * interval_ms
    ts = [start_ms // 1000]
    for i in range(candle_count):
        close_ms = start_ms + (i+1) * interval_ms
        ts.append(min(close_ms, now_ms) // 1000)
    return ts


def token_sample_calls(token_uuid: str, pool_keys: list[str]) -> list[str]:
    """Mirrors fetchTokenSample — sorted the same way fetchFromPoolManager does it:
       Array.from(new Set(calls)).sort()  (JS lexicographic sort)."""
    calls = set([
        f'get_token_price_in_usd("{token_uuid}")',
        f'get_token_price_in_htr("{token_uuid}")',
    ])
    for pool_key in pool_keys:
        parts = pool_key.split("/")
        if len(parts) != 3:
            continue
        t0, t1, fee = parts
        calls.add(f'front_end_api_pool("{pool_key}")')
        calls.add(f'get_token_price_in_usd("{t0}")')
        calls.add(f'get_token_price_in_htr("{t0}")')
        calls.add(f'get_reserves("{t0}", "{t1}", {int(fee)})')
    return sorted(calls)  # matches JS: Array.from(new Set(calls)).sort()


def pool_sample_calls(pool_key: str) -> list[str]:
    """Mirrors fetchPoolSample — sorted the same way fetchFromPoolManager does it."""
    parts = pool_key.split("/")
    t0, t1 = parts[0], parts[1]
    return sorted({
        f'front_end_api_pool("{pool_key}")',
        f'get_token_price_in_usd("{t0}")',
        f'get_token_price_in_usd("{t1}")',
    })


async def fetch_state(session, calls: list[str], timestamp: Optional[int], node_url: str, api_key: str, contract_id: str):
    params = [f"id={contract_id}"] + [f"calls[]={c}" for c in calls]
    if timestamp is not None:
        params.append(f"timestamp={timestamp}")
    url = f"{node_url}/nano_contract/state?{'&'.join(params)}"
    headers = {"X-API-Key": api_key} if api_key else {}
    t0 = time.perf_counter()
    try:
        async with session.get(url, headers=headers, timeout=aiohttp.ClientTimeout(total=60)) as resp:
            data = await resp.json(content_type=None)
            cache_status = resp.headers.get("X-Cache-Status", "?")
            elapsed = time.perf_counter() - t0
            ok = bool(data.get("calls"))
            return data, elapsed, cache_status, ok
    except Exception as e:
        return {"error": str(e)}, time.perf_counter() - t0, "ERR", False


async def bench(node_url, api_key, contract_id, timestamps, calls, concurrency, label):
    now_s = int(time.time())
    sem = asyncio.Semaphore(concurrency)
    results = []

    async def one(ts):
        is_live = ts >= now_s - 5
        async with sem:
            data, elapsed, cache, ok = await fetch_state(
                session, calls, None if is_live else ts, node_url, api_key, contract_id
            )
            results.append((ts, elapsed, cache, ok))
            status = "OK " if ok else "ERR"
            print(f"  [{status}][{cache:4s}] {'live    ' if is_live else f'ts={ts}'}  {elapsed:.2f}s")

    connector = aiohttp.TCPConnector(limit=concurrency + 5, ssl=True)
    async with aiohttp.ClientSession(connector=connector) as session:
        print(f"\n{'='*65}")
        print(f"{label}  ({len(timestamps)} timestamps, concurrency={concurrency})")
        print(f"Calls per request: {len(calls)}")
        print(f"{'='*65}")
        wall_start = time.perf_counter()
        await asyncio.gather(*[one(ts) for ts in timestamps])
        wall = time.perf_counter() - wall_start

    ok_latencies = sorted([r[1] for r in results if r[3]])
    hits   = sum(1 for r in results if "HIT"  in r[2])
    misses = sum(1 for r in results if "MISS" in r[2])
    errors = sum(1 for r in results if not r[3])

    print(f"\n--- {label} ---")
    print(f"  Timestamps  : {len(timestamps)}")
    print(f"  Cache hits  : {hits}  misses: {misses}  errors: {errors}")
    print(f"  Wall time   : {wall:.2f}s")
    if ok_latencies:
        n = len(ok_latencies)
        print(f"  p50={ok_latencies[n//2]:.2f}s  p95={ok_latencies[int(n*.95)]:.2f}s  max={ok_latencies[-1]:.2f}s")
    if wall > 50:
        print(f"  ⚠️  WOULD TIMEOUT on Vercel 60s limit!")
    elif wall > 30:
        print(f"  ⚠️  Slow — combined with other queries may exceed 60s")
    else:
        print(f"  ✅ OK")
    print(f"\n  Cache miss means nginx cache not warming correctly!")
    print(f"  All requests should show HIT after first load.")


async def main():
    p = argparse.ArgumentParser()
    p.add_argument("--node",        default=NODE_URL)
    p.add_argument("--api-key",     default=API_KEY)
    p.add_argument("--contract",    default=CONTRACT_ID)
    p.add_argument("--token",       default=None)
    p.add_argument("--pool",        default=None)
    p.add_argument("--range",       choices=["24h","3d","1w"], default="24h")
    p.add_argument("--concurrency", type=int, default=5)
    args = p.parse_args()

    connector = aiohttp.TCPConnector(ssl=True)
    async with aiohttp.ClientSession(connector=connector) as session:
        print(f"Checking node liveness...")
        _, elapsed, cache, ok = await fetch_state(
            session, ["get_all_pools()"], None, args.node, args.api_key, args.contract
        )
        if not ok:
            print("  ❌ Node unreachable"); return
        data, *_ = await fetch_state(session, ["get_all_pools()"], None, args.node, args.api_key, args.contract)
        pool_keys: list[str] = data.get("calls",{}).get("get_all_pools()",{}).get("value",[])
        print(f"  ✅ Node OK ({elapsed:.2f}s) — {len(pool_keys)} pool(s)")

    if args.token:
        # Find pools for this token
        token_pool_keys = [pk for pk in pool_keys if args.token in pk]
        print(f"\nToken {args.token} is in {len(token_pool_keys)} pool(s): {token_pool_keys}")
        if not token_pool_keys:
            print("Token not found in any pool."); return

        ts_list = token_chart_timestamps(args.range)
        calls = token_sample_calls(args.token, token_pool_keys)
        print(f"\nExact calls the app sends per timestamp ({len(calls)} total):")
        for c in calls:
            print(f"  {c}")

        connector = aiohttp.TCPConnector(limit=args.concurrency+5, ssl=True)
        async with aiohttp.ClientSession(connector=connector) as session:
            await bench(args.node, args.api_key, args.contract, ts_list, calls, args.concurrency,
                       f"Token chart {args.range} (EXACT app calls)")

    if args.pool:
        ts_list = pool_chart_timestamps(args.range)
        calls = pool_sample_calls(args.pool)
        print(f"\nExact calls the app sends per timestamp ({len(calls)} total):")
        for c in calls:
            print(f"  {c}")

        connector = aiohttp.TCPConnector(limit=args.concurrency+5, ssl=True)
        async with aiohttp.ClientSession(connector=connector) as session:
            await bench(args.node, args.api_key, args.contract, ts_list, calls, args.concurrency,
                       f"Pool chart {args.range} (EXACT app calls)")

    if not args.token and not args.pool:
        print("\nNo --token or --pool given — showing pool list only.")
        print("Pool keys:", pool_keys[:5])


if __name__ == "__main__":
    asyncio.run(main())
