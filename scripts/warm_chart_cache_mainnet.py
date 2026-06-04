#!/usr/bin/env python3
"""
Nginx chart-cache warmer — sends EXACT same URLs the app uses.

Each timestamp batches the same calls[] as fetchTokenSample / fetchPoolSample,
so the nginx cache key matches and subsequent app requests get HIT.

Cron (on the node server, every 30 min):
  */30 * * * * HATHOR_API_KEY=KEY POOL_MANAGER_ID=ID python3 warm_chart_cache.py >> /home/dozer/log/chart-warmer.log 2>&1

Run once to warm all timestamps (e.g. after server restart):
  WARM_WINDOW_S=90000 python3 warm_chart_cache.py
"""

import asyncio, math, os, sys, time
from typing import Optional
import aiohttp

NODE_URL    = os.environ.get("HATHOR_NODE_URL",  "https://node.mainnet.dozer.finance/v1a")
API_KEY     = os.environ.get("HATHOR_API_KEY",   "35c3ba9207bf3a7911ab1003b39dd5d24ec06d5b45f6582a1e66386469288450")
CONTRACT_ID = os.environ.get("POOL_MANAGER_ID",  "000080350ca5ef204bc29b3232bb197e12bec6b473f5e6bdb749a6921197e83c")
WARM_WINDOW_S = int(os.environ.get("WARM_WINDOW_S", str(35 * 60)))
CONCURRENCY   = int(os.environ.get("CONCURRENCY", "3"))

# Keep in sync with packages/api/src/utils/chart/constants.ts
INTRA_CANDLE_SAMPLES = 1
CANDLE_INTERVAL_MS = {"24h": 30*60*1000, "3d": 2*60*60*1000, "1w": 4*60*60*1000}
TIME_RANGE_MS      = {"24h": 24*60*60*1000, "3d": 3*24*60*60*1000, "1w": 7*24*60*60*1000}

log = lambda msg: print(f"[{time.strftime('%H:%M:%S')}] {msg}", flush=True)


def all_chart_timestamps(time_range: str, now_ms: int) -> list[int]:
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


def pool_chart_timestamps(time_range: str, now_ms: int) -> list[int]:
    interval_ms = CANDLE_INTERVAL_MS[time_range]
    candle_count = math.ceil(TIME_RANGE_MS[time_range] / interval_ms)
    end_aligned = math.ceil(now_ms / interval_ms) * interval_ms
    start_ms = end_aligned - candle_count * interval_ms
    ts = [start_ms // 1000]
    for i in range(candle_count):
        close_ms = start_ms + (i+1) * interval_ms
        ts.append(min(close_ms, now_ms) // 1000)
    return ts


def new_timestamps(ts_list: list[int], now_s: int, window_s: int) -> list[int]:
    """Return only timestamps that entered the chart window recently and are cacheable."""
    cutoff = now_s - window_s
    return [ts for ts in ts_list if cutoff <= ts < now_s - 60]


def token_sample_calls(token_uuid: str, pool_keys: list[str]) -> list[str]:
    """Exact match to fetchTokenSample — sorted identically to fetchFromPoolManager:
       normalizedCalls = Array.from(new Set(calls)).sort()  (JS lexicographic)."""
    calls: set[str] = {
        f'get_token_price_in_usd("{token_uuid}")',
        f'get_token_price_in_htr("{token_uuid}")',
    }
    for pool_key in pool_keys:
        parts = pool_key.split("/")
        if len(parts) != 3:
            continue
        t0, t1, fee = parts
        calls.add(f'front_end_api_pool("{pool_key}")')
        calls.add(f'get_token_price_in_usd("{t0}")')
        calls.add(f'get_token_price_in_htr("{t0}")')
        calls.add(f'get_reserves("{t0}", "{t1}", {int(fee)})')
    return sorted(calls)


def pool_sample_calls(pool_key: str) -> list[str]:
    """Exact match to fetchPoolSample — sorted identically to fetchFromPoolManager."""
    parts = pool_key.split("/")
    t0, t1 = parts[0], parts[1]
    return sorted({
        f'front_end_api_pool("{pool_key}")',
        f'get_token_price_in_usd("{t0}")',
        f'get_token_price_in_usd("{t1}")',
    })


async def fetch_and_cache(session, calls: list[str], timestamp: Optional[int]) -> tuple[bool, float, str]:
    params = [f"id={CONTRACT_ID}"] + [f"calls[]={c}" for c in calls]
    if timestamp is not None:
        params.append(f"timestamp={timestamp}")
    url = f"{NODE_URL}/nano_contract/state?{'&'.join(params)}"
    headers = {"X-API-Key": API_KEY} if API_KEY else {}
    t0 = time.perf_counter()
    try:
        async with session.get(url, headers=headers, timeout=aiohttp.ClientTimeout(total=60)) as resp:
            data = await resp.json(content_type=None)
            cache_status = resp.headers.get("X-Cache-Status", "?")
            ok = bool(data.get("calls"))
            return ok, time.perf_counter() - t0, cache_status
    except Exception as e:
        return False, time.perf_counter() - t0, "ERR"


async def warm_pool(session, pool_key: str, sem: asyncio.Semaphore, now_s: int, now_ms: int) -> dict:
    parts = pool_key.split("/")
    if len(parts) != 3:
        return {}
    t0, t1, fee = parts

    # Unique tokens in this pool
    tokens = list({t0, t1})

    stats = {"pool": pool_key, "warmed": 0, "hits": 0, "errors": 0}

    for time_range in ["24h", "3d", "1w"]:
        # Token chart timestamps
        all_ts = all_chart_timestamps(time_range, now_ms)
        ts_list = new_timestamps(all_ts, now_s, WARM_WINDOW_S)

        for token_uuid in tokens:
            token_pool_keys = [pool_key]  # this token's pool
            calls = token_sample_calls(token_uuid, token_pool_keys)
            for ts in ts_list:
                async with sem:
                    ok, elapsed, cache = await fetch_and_cache(session, calls, ts)
                    if ok:
                        stats["warmed"] += 1
                        if "HIT" in cache:
                            stats["hits"] += 1
                    else:
                        stats["errors"] += 1

        # Pool chart timestamps
        pool_ts = pool_chart_timestamps(time_range, now_ms)
        pool_new_ts = new_timestamps(pool_ts, now_s, WARM_WINDOW_S)
        p_calls = pool_sample_calls(pool_key)
        for ts in pool_new_ts:
            async with sem:
                ok, elapsed, cache = await fetch_and_cache(session, p_calls, ts)
                if ok:
                    stats["warmed"] += 1
                    if "HIT" in cache:
                        stats["hits"] += 1
                else:
                    stats["errors"] += 1

    return stats


async def main():
    now_s  = int(time.time())
    now_ms = now_s * 1000

    log(f"Chart cache warmer — node: {NODE_URL}")
    log(f"Window: {WARM_WINDOW_S//60}min, concurrency: {CONCURRENCY}")

    connector = aiohttp.TCPConnector(limit=CONCURRENCY + 5, ssl=True)
    async with aiohttp.ClientSession(connector=connector) as session:
        # Get all pools
        params = [f"id={CONTRACT_ID}", "calls[]=get_all_pools()"]
        url = f"{NODE_URL}/nano_contract/state?{'&'.join(params)}"
        headers = {"X-API-Key": API_KEY} if API_KEY else {}
        try:
            async with session.get(url, headers=headers, timeout=aiohttp.ClientTimeout(total=30)) as resp:
                data = await resp.json(content_type=None)
                pool_keys: list[str] = data.get("calls",{}).get("get_all_pools()",{}).get("value",[])
        except Exception as e:
            log(f"ERROR fetching pool list: {e}"); sys.exit(1)

        if not pool_keys:
            log("No pools found."); sys.exit(0)

        log(f"Found {len(pool_keys)} pool(s). Warming with exact app call signatures...")

        # Show counts per range
        for tr in ["24h", "3d", "1w"]:
            all_ts = all_chart_timestamps(tr, now_ms)
            new_ts = new_timestamps(all_ts, now_s, WARM_WINDOW_S)
            log(f"  {tr}: {len(new_ts)} new token-chart timestamp(s) to warm")

        sem = asyncio.Semaphore(CONCURRENCY)
        results = await asyncio.gather(*[warm_pool(session, pk, sem, now_s, now_ms) for pk in pool_keys])

    total_warmed = sum(r.get("warmed", 0) for r in results)
    total_hits   = sum(r.get("hits",   0) for r in results)
    total_errors = sum(r.get("errors", 0) for r in results)
    for r in results:
        if r.get("warmed", 0) > 0:
            log(f"  {r['pool']}: {r['warmed']} warmed ({r['hits']} already cached), {r['errors']} errors")
    log(f"Done. warmed={total_warmed}, already_cached={total_hits}, errors={total_errors}")


if __name__ == "__main__":
    asyncio.run(main())
