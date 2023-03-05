export function shortenAddress(address: string, characters = 4): string {
  return `${address.substring(0, characters + 2)}...${address.substring(35 - characters)}`
}
