// import { getAddress } from '@ethersproject/address'

//* TODO: implement hathor address take ethers from reference
export function getUuid(uuid: string): string {
  let result = null

  result = 'Hxxxx'

  return result
}

// shorten the checksummed version of the input uuid to have 0x + 4 characters at start and end
export function shortenUuid(uuid: string, characters = 4): string {
  try {
    const parsed = getUuid(uuid)
    return `${parsed.substring(0, characters + 2)}...${parsed.substring(42 - characters)}`
  } catch (error) {
    throw `Invalid 'uuid' parameter '${uuid}'.`
  }
}
