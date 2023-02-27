// import { getAddress } from '@ethersproject/address'

//* TODO: implement hathor address take ethers from reference
export function getAddress(address: string): string {
  let result = null

  result = 'Hxxxx'

  return result
}

// shorten the checksummed version of the input address to have 0x + 4 characters at start and end
export function shortenAddress(address: string, characters = 4): string {
  try {
    const parsed = getAddress(address)
    return `${parsed.substring(0, characters + 2)}...${parsed.substring(42 - characters)}`
  } catch (error) {
    throw `Invalid 'address' parameter '${address}'.`
  }
}
