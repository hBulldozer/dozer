// thoth.id (Hathor name service) base URL, without trailing slash
export const THOTH_URL = (process.env.NEXT_PUBLIC_THOTH_URL || 'https://testnet.thoth.id').replace(/\/+$/, '')
