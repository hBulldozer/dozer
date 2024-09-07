export class CustomToken {
  public uuid?: string
  public readonly symbol: string
  public readonly name: string
  public readonly totalSupply: number

  public constructor(symbol: string, name: string, totalSupply: number) {
    this.symbol = symbol
    this.name = name
    this.totalSupply = totalSupply
  }

  public async create(address: string) {
    try {
      const response = await fetch(`${process.env.LOCAL_WALLET_MASTER_URL}/wallet/create-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-id': 'default',
        },
        body: JSON.stringify({
          name: this.name,
          symbol: this.symbol,
          amount: this.totalSupply,
          address: address,
        }),
      })

      const data = await response.json()

      console.log(data)

      if (data && data.hash) {
        return {
          success: true,
          hash: data.hash,
        }
      } else {
        throw new Error('Failed to create token on blockchain')
      }
    } catch (error) {
      console.error('Error creating token:', error)
      throw error
    }
  }
}
