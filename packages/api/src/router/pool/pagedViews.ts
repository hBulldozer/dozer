import { fetchFromPoolManager } from './helpers'

/**
 * Reads the pool manager's list views through their paged variants
 * (get_pool_count + get_*_page), so responses stay bounded as the number of pools grows.
 *
 * The first request asks for the pool count and the first page of every requested view at once,
 * so up to one page of pools this costs the same single request as the old unpaged views.
 * Contracts without the paged views (not yet upgraded, or a historical timestamp before the
 * upgrade) fall back to the old views.
 */

export interface PagedView<T> {
  /** Paged call, e.g. get_pools_page(skip, limit) */
  page: (skip: number, limit: number) => string
  /** Unpaged call with the same result, for contracts without paged views */
  legacy: string
  /** Pools per page; path-finding views (prices) use smaller pages to stay within view limits */
  pageSize: number
  empty: T
  merge: (into: T, page: T) => T
}

const POOL_COUNT_CALL = 'get_pool_count()'

const concatPages = <T>(into: T[], page: T[]) => into.concat(page)
const mergeRecords = <T>(into: Record<string, T>, page: Record<string, T>) => ({ ...into, ...page })

export const POOL_KEYS: PagedView<string[]> = {
  page: (skip, limit) => `get_pools_page(${skip}, ${limit})`,
  legacy: 'get_all_pools()',
  pageSize: 100,
  empty: [],
  merge: concatPages,
}

export const SIGNED_POOL_KEYS: PagedView<string[]> = {
  page: (skip, limit) => `get_signed_pools_page(${skip}, ${limit})`,
  legacy: 'get_signed_pools()',
  pageSize: 100,
  empty: [],
  merge: concatPages,
}

export const TOKEN_PRICES_USD: PagedView<Record<string, number>> = {
  page: (skip, limit) => `get_token_prices_in_usd_page(${skip}, ${limit})`,
  legacy: 'get_all_token_prices_in_usd()',
  pageSize: 50,
  empty: {},
  merge: mergeRecords,
}

export const TOKEN_PRICES_HTR: PagedView<Record<string, number>> = {
  page: (skip, limit) => `get_token_prices_in_htr_page(${skip}, ${limit})`,
  legacy: 'get_all_token_prices_in_htr()',
  pageSize: 50,
  empty: {},
  merge: mergeRecords,
}

export const userPositions = (address: string): PagedView<Record<string, any[]>> => ({
  page: (skip, limit) => `get_user_positions_page("${address}", ${skip}, ${limit})`,
  legacy: `get_user_positions("${address}")`,
  pageSize: 100,
  empty: {},
  merge: mergeRecords,
})

type CallResult = { value?: unknown; errmsg?: string } | undefined

const valueOf = (calls: Record<string, CallResult>, call: string): unknown => {
  const result = calls?.[call]
  if (!result || result.errmsg !== undefined || result.value === undefined) {
    throw new Error(`Pool manager call failed: ${call}${result?.errmsg ? ` (${result.errmsg})` : ''}`)
  }
  return result.value
}

/** Results of several paged views, in the order given. */
export async function fetchPagedViews(
  views: PagedView<any>[],
  timestamp?: number
): Promise<any[]> {
  const firstPages = views.map((view) => view.page(0, view.pageSize))
  const first = await fetchFromPoolManager([POOL_COUNT_CALL, ...firstPages], timestamp)
  const count = first.calls?.[POOL_COUNT_CALL] as CallResult

  if (!count || count.errmsg !== undefined || count.value === undefined) {
    // No paged views on this contract (or at this timestamp)
    const legacy = await fetchFromPoolManager(
      views.map((view) => view.legacy),
      timestamp
    )
    // Same tolerance as the old call sites (`.value || []`)
    return views.map((view) => (legacy.calls?.[view.legacy] as CallResult)?.value ?? view.empty)
  }

  const total = Number(count.value)
  const results = views.map((view, i) => view.merge(view.empty, valueOf(first.calls, firstPages[i]!) as any))

  const remaining: { viewIndex: number; call: string }[] = []
  views.forEach((view, viewIndex) => {
    for (let skip = view.pageSize; skip < total; skip += view.pageSize) {
      remaining.push({ viewIndex, call: view.page(skip, view.pageSize) })
    }
  })
  if (remaining.length > 0) {
    const rest = await fetchFromPoolManager(
      remaining.map((r) => r.call),
      timestamp
    )
    for (const { viewIndex, call } of remaining) {
      results[viewIndex] = views[viewIndex]!.merge(results[viewIndex], valueOf(rest.calls, call) as any)
    }
  }
  return results
}

export async function fetchPagedView<T>(view: PagedView<T>, timestamp?: number): Promise<T> {
  const [result] = await fetchPagedViews([view], timestamp)
  return result as T
}
