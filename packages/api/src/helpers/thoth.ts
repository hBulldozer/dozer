import { ThothIdSDK } from 'thoth-id-sdk'

import { sameOrigin } from './fetchFunction'

// thoth.id (Hathor naming service) reverse lookups: address -> primary name.

const HIT_TTL_MS = 10 * 60 * 1000
const MISS_TTL_MS = 60 * 1000

type NetworkType = 'mainnet' | 'testnet' | 'privatenet'

// Mirrors packages/higmi/config/bridge.ts network detection
function getNetworkType(): NetworkType {
  const nodeUrl = process.env.NEXT_PUBLIC_LOCAL_NODE_URL || ''
  if (nodeUrl.includes('localhost') || nodeUrl.includes('127.0.0.1') || nodeUrl.includes('0.0.0.0')) {
    return 'privatenet'
  }
  if (nodeUrl.includes('testnet') || nodeUrl.includes('self2.dozer.finance')) {
    return 'testnet'
  }
  return 'mainnet'
}

export function isThothEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_THOTH_BLUEPRINT_ID) return true
  return getNetworkType() === 'testnet'
}

// Accepts `//host`, `http(s)://host/v1a/` etc. and returns `<origin>/v1a/nano_contract/state`
function buildNodeStateUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined
  let url = raw.trim()
  if (!url) return undefined
  if (url.startsWith('//')) url = `https:${url}`
  else if (!/^https?:\/\//i.test(url)) url = `https://${url}`
  url = url.replace(/\/v1a(\/.*)?$/, '').replace(/\/+$/, '')
  return `${url}/v1a/nano_contract/state`
}

const SDK_RETRIES = 3
const LOCAL_NODE_RETRY_MS = 60_000

// The API key belongs to our node: only send it to the local node's origin, never to a public/default node
function createSdk(nodeUrl?: string): ThothIdSDK {
  const blueprintId = process.env.NEXT_PUBLIC_THOTH_BLUEPRINT_ID
  const apiKey = process.env.NODE_API_KEY
  const localUrl = buildNodeStateUrl(process.env.NEXT_PUBLIC_LOCAL_NODE_URL)
  const headers = apiKey && nodeUrl && sameOrigin(nodeUrl, localUrl) ? { 'X-API-Key': apiKey } : undefined
  return new ThothIdSDK({
    ...(nodeUrl ? { nodeUrl } : {}),
    ...(blueprintId ? { blueprintId } : {}),
    ...(headers ? { headers } : {}),
    retries: SDK_RETRIES,
  })
}

let sdkPromise: Promise<ThothIdSDK> | null = null
// Whether the active SDK talks to our own node (no throttling needed) or a public one
let activeOnLocalNode = false
let nextLocalRetryAt = 0

// Server-only override: pin lookups to one node (e.g. the public node while ours is still syncing)
function getPinnedUrl(): string | undefined {
  return buildNodeStateUrl(process.env.THOTH_NODE_URL)
}

async function initSdk(): Promise<ThothIdSDK> {
  const pinnedUrl = getPinnedUrl()
  if (pinnedUrl) {
    const sdk = createSdk(pinnedUrl)
    await sdk.loadContractIds()
    activeOnLocalNode = sameOrigin(pinnedUrl, buildNodeStateUrl(process.env.NEXT_PUBLIC_LOCAL_NODE_URL))
    nextLocalRetryAt = 0
    return sdk
  }

  const primaryUrl = buildNodeStateUrl(process.env.NEXT_PUBLIC_LOCAL_NODE_URL)
  const fallbackUrl = buildNodeStateUrl(
    getNetworkType() === 'testnet' ? process.env.NEXT_PUBLIC_TESTNET_NODE_URL : process.env.NEXT_PUBLIC_PUBLIC_NODE_URL,
  )

  const candidates: (string | undefined)[] = [primaryUrl, fallbackUrl, undefined].filter(
    (url, index, all) => all.indexOf(url) === index,
  )

  let lastError: unknown
  for (const url of candidates) {
    try {
      const sdk = createSdk(url)
      await sdk.loadContractIds()
      activeOnLocalNode = !!url && url === primaryUrl
      nextLocalRetryAt = activeOnLocalNode ? 0 : Date.now() + LOCAL_NODE_RETRY_MS
      return sdk
    } catch (error) {
      lastError = error
    }
  }
  throw lastError
}

// While running on a fallback node, try to get back onto the local node (in the background, at most once per minute)
function maybeRetryLocalNode(current: Promise<ThothIdSDK>) {
  if (getPinnedUrl()) return
  const primaryUrl = buildNodeStateUrl(process.env.NEXT_PUBLIC_LOCAL_NODE_URL)
  if (!primaryUrl || activeOnLocalNode || Date.now() < nextLocalRetryAt) return
  nextLocalRetryAt = Date.now() + LOCAL_NODE_RETRY_MS
  const sdk = createSdk(primaryUrl)
  sdk
    .loadContractIds()
    .then(() => {
      if (sdkPromise !== current) return
      sdkPromise = Promise.resolve(sdk)
      activeOnLocalNode = true
      nextLocalRetryAt = 0
    })
    .catch(() => {})
}

function getSdk(): Promise<ThothIdSDK> {
  if (!sdkPromise) {
    const promise = initSdk()
    sdkPromise = promise
    promise.catch(() => {
      if (sdkPromise === promise) sdkPromise = null
    })
  } else {
    maybeRetryLocalNode(sdkPromise)
  }
  return sdkPromise
}

// Warm-up: start registry discovery when the router module loads
if (isThothEnabled()) {
  void getSdk().catch(() => {})
}

const primaryNameCache = new Map<string, { expiresAt: number; name: string | null }>()

// Contract rejects malformed addresses with InvalidAddress: that is a definitive "no name"
const isInvalidAddressMessage = (message: string) => message.includes('InvalidAddress')

// Contract-level rejections (NameNotFound, expired, ...) as opposed to transport/rate-limit failures
const isContractError = (error: unknown) => error instanceof Error && error.message.includes('Nano contract error')

const PUBLIC_NODE_CALL_GAP_MS = 350

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

// Serialized queue: public nodes rate-limit hard (the SDK retries 429/5xx itself). No gap on our own node.
let queueTail: Promise<unknown> = Promise.resolve()
let lastCallAt = 0

function queued<T>(fn: () => Promise<T>): Promise<T> {
  const run = async (): Promise<T> => {
    const wait = activeOnLocalNode ? 0 : lastCallAt + PUBLIC_NODE_CALL_GAP_MS - Date.now()
    if (wait > 0) await sleep(wait)
    try {
      return await fn()
    } finally {
      lastCallAt = Date.now()
    }
  }
  const result = queueTail.then(run, run)
  queueTail = result.catch(() => undefined)
  return result
}

/**
 * Returns the primary names (without the domain suffix, '' when none) for each address in a domain.
 * One batched call; per-address InvalidAddress results mean "no name", any other failure throws.
 */
async function fetchPrimaryNames(sdk: ThothIdSDK, addresses: string[], suffix: string): Promise<Record<string, string>> {
  const out: Record<string, string> = {}
  if (addresses.length === 0) return out
  const results = await queued(() =>
    sdk.callMultipleSettled(
      addresses.map((address) => ({ method: 'get_manager_primary_name', params: [address] })),
      suffix,
    ),
  )
  addresses.forEach((address, i) => {
    const result = results[i]
    if (!result) throw new Error('thoth: missing batch result')
    if (result.ok) {
      out[address] = typeof result.value === 'string' ? result.value : ''
    } else if (isInvalidAddressMessage(result.error)) {
      out[address] = ''
    } else {
      throw new Error(result.error)
    }
  })
  return out
}

async function lookupUncached(addresses: string[]): Promise<Record<string, string | null>> {
  const sdk = await getSdk()
  const resolved: Record<string, string | null> = {}
  let pending = [...addresses]

  for (const suffix of sdk.getDomains()) {
    if (pending.length === 0) break
    const names = await fetchPrimaryNames(sdk, pending, suffix)

    for (const address of pending) {
      const raw = names[address]
      if (!raw) continue
      const full = raw.endsWith(`.${suffix}`) ? raw : `${raw}.${suffix}`
      try {
        if ((await queued(() => sdk.resolveName(full))) === address) resolved[address] = full
      } catch (error) {
        // NameNotFound / expired = not verified; rate-limit or transport errors propagate (never cached)
        if (!isContractError(error)) throw error
      }
    }
    pending = pending.filter((address) => !(address in resolved))
  }

  for (const address of pending) resolved[address] = null
  return resolved
}

// Pending lookups per address, so concurrent requests share one lookup
const inFlight = new Map<string, Promise<string | null>>()

export async function resolvePrimaryNames(addresses: string[]): Promise<Record<string, string | null>> {
  const unique = Array.from(new Set(addresses.filter(Boolean)))
  const result: Record<string, string | null> = {}

  if (!isThothEnabled()) {
    for (const address of unique) result[address] = null
    return result
  }

  const now = Date.now()
  const waiting: Promise<void>[] = []
  const fresh: string[] = []
  for (const address of unique) {
    const entry = primaryNameCache.get(address)
    const pendingLookup = inFlight.get(address)
    if (entry && entry.expiresAt > now) {
      result[address] = entry.name
    } else if (pendingLookup) {
      waiting.push(pendingLookup.then((name) => void (result[address] = name)))
    } else {
      fresh.push(address)
    }
  }

  if (fresh.length > 0) {
    // Caching happens here, so it completes even if every caller gave up waiting
    const batch = lookupUncached(fresh).then((names) => {
      const cachedAt = Date.now()
      for (const address of fresh) {
        const name = names[address] ?? null
        primaryNameCache.set(address, { expiresAt: cachedAt + (name ? HIT_TTL_MS : MISS_TTL_MS), name })
      }
      return names
    })
    batch.catch(() => {}) // avoid unhandled rejection; callers observe it through their per-address promises
    for (const address of fresh) {
      const perAddress = batch
        .then((names) => names[address] ?? null)
        .finally(() => {
          if (inFlight.get(address) === perAddress) inFlight.delete(address)
        })
      perAddress.catch(() => {})
      inFlight.set(address, perAddress)
      waiting.push(perAddress.then((name) => void (result[address] = name)))
    }
  }

  await Promise.all(waiting)
  return result
}

export async function resolvePrimaryName(address: string): Promise<string | null> {
  const map = await resolvePrimaryNames([address])
  return map[address] ?? null
}
