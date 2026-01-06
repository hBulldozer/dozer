export interface TokenPrices {
  htr: number
  btc: number
  eth: number
  usdc: number
  husdc: number
}

export type TradingPair = 'BTC' | 'ETH' | 'hUSDC' | 'hUSDC'

interface PoolConfig {
  liquidityValue: number // Initial deposit value in USD
  holdPeriod: number // Hold period in months
  bonusRate: number // Bonus rate
  dexFees: number // DEX fees percentage (e.g., 25 for 25%)
  tradingPair: TradingPair // The token paired with HTR
}

interface PriceChanges {
  htrChange: number // Percentage change in HTR price
  tokenChange: number // Percentage change in paired token price
}

interface CalculationResult {
  priceChanges: {
    htr: number // HTR price change percentage
    token: number // Paired token price change percentage
    endHtrPrice: number // Final HTR price
    endTokenPrice: number // Final paired token price
  }
  endingPoolBalances: {
    token: number // Final token balance
    htr: number // Final HTR balance
    tokenDexFees: number // DEX fees in token
    tokenDeficit: number // Deficit in token
  }
  endingLPWithdraw: {
    token: number // Token amount to withdraw
    htrIlProtection: number // IL protection in HTR
    lpValue: number // Total LP value in token
  }
  plusBonus: {
    hodl: number // Bonus if holding
    sell: number // Bonus if selling
  }
  percentageDelta: {
    vsTokenHodl: number // Return vs holding token
    hodl: number // Return if holding bonus
    sell: number // Return if selling bonus
  }
}

export class ImprovedPairCalculator {
  private readonly initialPrices: TokenPrices
  private readonly config: PoolConfig
  private readonly initialTokenPrice: number
  private readonly initialHtrAmount: number
  private readonly initialTokenAmount: number

  constructor(tokenPrices: TokenPrices, config: PoolConfig) {
    this.initialPrices = tokenPrices
    this.config = config
    this.initialTokenPrice = this.getTokenPrice(config.tradingPair)

    // Calculate initial amounts
    this.initialTokenAmount = this.config.liquidityValue / this.initialTokenPrice
    this.initialHtrAmount = this.config.liquidityValue / this.initialPrices.htr
  }

  private getTokenPrice(token: TradingPair): number {
    switch (token) {
      case 'BTC':
        return this.initialPrices.btc
      case 'ETH':
        return this.initialPrices.eth
      case 'hUSDC':
        return this.initialPrices.usdc
      case 'hUSDC':
        return this.initialPrices.husdc
      default:
        throw new Error(`Unsupported token: ${token}`)
    }
  }

  calculatePosition(changes: PriceChanges): CalculationResult {
    // Calculate new prices
    const htrChange = changes.htrChange / 100
    const tokenChange = changes.tokenChange / 100

    const newHtrPrice = this.initialPrices.htr * (1 + htrChange)
    const newTokenPrice = this.initialTokenPrice * (1 + tokenChange)

    // Calculate constant product (k)
    const k = this.initialTokenAmount * this.initialHtrAmount
    const R = newTokenPrice / newHtrPrice

    // Calculate new balances maintaining constant product
    const newTokenBalance = Math.sqrt(k / R)
    const newHtrBalance = k / newTokenBalance

    const endingTokenBalance = newTokenBalance * (1 + this.config.dexFees / 100)
    const endingHTRBalance = newHtrBalance * (1 + this.config.dexFees / 100)

    const tokenDexFees = endingTokenBalance - newTokenBalance

    const tokenDeficit = endingTokenBalance > this.initialTokenAmount ? 0 : this.initialTokenAmount - endingTokenBalance

    const endingTokenWithdraw =
      endingTokenBalance > this.initialTokenAmount ? this.initialTokenAmount + tokenDexFees : endingTokenBalance
    const endingHTRWithdraw =
      (tokenDeficit * newTokenPrice) / newHtrPrice > endingHTRBalance
        ? endingHTRBalance
        : (tokenDeficit * newTokenPrice) / newHtrPrice

    // Calculate IL protection in HTR
    const htrIlProtection = (tokenDeficit * newTokenPrice) / newHtrBalance

    // Calculate LP value in token terms
    const lpValue = endingTokenWithdraw * newTokenPrice + endingHTRWithdraw * newHtrPrice

    const bonusValueHTR = (this.config.liquidityValue * this.config.bonusRate) / this.initialPrices.htr
    // Calculate bonus values
    const hodlBonus = bonusValueHTR * newHtrPrice
    const sellBonus = ((bonusValueHTR * this.initialPrices.htr) / this.initialTokenPrice) * newTokenPrice

    // Calculate percentage returns
    const baseValue = this.config.liquidityValue
    const lpValueWithHodlBonus = lpValue + hodlBonus
    const lpValueWithSellBonus = lpValue + sellBonus

    const vsTokenHodl = ((lpValueWithHodlBonus - baseValue) / baseValue) * 100
    const hodlReturn = ((lpValueWithHodlBonus - baseValue) / baseValue) * 100
    const sellReturn = ((lpValueWithSellBonus - baseValue) / baseValue) * 100

    return {
      priceChanges: {
        htr: changes.htrChange,
        token: changes.tokenChange,
        endHtrPrice: newHtrPrice,
        endTokenPrice: newTokenPrice,
      },
      endingPoolBalances: {
        token: newTokenBalance,
        htr: newHtrBalance,
        tokenDexFees,
        tokenDeficit,
      },
      endingLPWithdraw: {
        token: newTokenBalance,
        htrIlProtection,
        lpValue,
      },
      plusBonus: {
        hodl: hodlBonus,
        sell: sellBonus,
      },
      percentageDelta: {
        vsTokenHodl,
        hodl: hodlReturn,
        sell: sellReturn,
      },
    }
  }

  generateAnalysis(htrChanges: number[] = [], tokenChanges: number[] = []): CalculationResult[] {
    const results: CalculationResult[] = []

    // If only HTR changes provided, use constant token price
    if (tokenChanges.length === 0) {
      tokenChanges = htrChanges.map(() => 0)
    }

    // Ensure arrays are the same length
    const length = Math.min(htrChanges.length, tokenChanges.length)

    for (let i = 0; i < length; i++) {
      results.push(
        this.calculatePosition({
          htrChange: htrChanges[i],
          tokenChange: tokenChanges[i],
        })
      )
    }

    return results
  }
}

// Example usage:
const calculator = new ImprovedPairCalculator(
  {
    htr: 0.07,
    btc: 98472.35,
    eth: 3361.67,
    usdc: 1.0,
    husdc: 1.0,
  },
  {
    liquidityValue: 10000,
    holdPeriod: 12,
    bonusRate: 2000,
    dexFees: 25,
    tradingPair: 'BTC',
  }
)

// Test with HTR up 50% and BTC down 20%
const testResult = calculator.calculatePosition({
  htrChange: 50,
  tokenChange: -20,
})

// Generate analysis for a range of price scenarios
const htrChanges = Array.from({ length: 21 }, (_, i) => -100 + i * 10) // -100% to +100%
const btcChanges = Array.from({ length: 21 }, (_, i) => -50 + i * 5) // -50% to +50%

const analysis = calculator.generateAnalysis(htrChanges, btcChanges)

// For chart data
const chartData = analysis.map((result) => ({
  htrPriceChange: result.priceChanges.htr,
  tokenPriceChange: result.priceChanges.token,
  hodlReturn: result.percentageDelta.hodl,
  sellReturn: result.percentageDelta.sell,
}))
