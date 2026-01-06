/**
 * Random crypto-themed loading phrases for RouteDisplay skeleton
 */
export const CRYPTO_LOADING_PHRASES = [
  'Hunting for alpha…',
  'Aping into best routes…', 
  'Diamond hands calculating…',
  'Finding moon routes…',
  'Degen mode activated…',
  'Optimizing your bags…',
  'Routing to Valhalla…',
  'Scanning for yield farms…',
  'Computing diamond path…',
  'Maximizing those gains…',
  'Finding the secret sauce…',
  'Loading rocket fuel…',
  'Activating money printer…',
  'Summoning liquidity gods…',
  'Calculating moon mission…',
  'Unlocking Chad routes…'
] as const

/**
 * Returns a random crypto-themed loading phrase
 */
export function getRandomCryptoPhrase(): string {
  const randomIndex = Math.floor(Math.random() * CRYPTO_LOADING_PHRASES.length)
  return CRYPTO_LOADING_PHRASES[randomIndex]
}