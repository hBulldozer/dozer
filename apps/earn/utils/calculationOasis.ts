export interface TokenPrices {
  htr: number
  btc: number
  eth: number
  usdc: number
  usdt: number
}

interface DepositAmount {
  amount: number
  currency: 'BTC' | 'ETH' | 'USDC' | 'USDT'
}

interface PoolConfig {
  deposit: DepositAmount
  holdPeriod: number // Hold period in months
  bonusValue: number // Bonus value in USD
  dexFees: number // DEX fees percentage
}

export interface CalculationResult {
  inputCurrency: {
    currency: string
    amount: number
    usdValue: number
  }
  endPrice: {
    usdt: number
    htrChange: number
    htrPrice: number
    htrBonus: number
  }
  startingBalances: {
    htr: number
    usdt: number
  }
  endingPoolBalances: {
    usdt: number
    htr: number
    usdtDexFees: number
    usdtDeficit: number
  }
  endingLPWithdraw: {
    usdt: number
    htrIlProtection: number
    lpValue: number
    originalCurrency: number
  }
  plusBonus: {
    hodl: number
    sell: number
  }
  priceChange: number
  percentageDelta: {
    vsUsdtHodl: number
    hodl: number
    sell: number
  }
}

export class MultiCurrencyLiquidityCalculator {
  private readonly prices: TokenPrices
  private readonly config: PoolConfig
  private readonly liquidityValueUSD: number

  constructor(tokenPrices: TokenPrices, config: PoolConfig) {
    this.prices = tokenPrices
    this.config = config

    // Convert deposit to USD value
    this.liquidityValueUSD = this.convertToUSD(config.deposit.amount, config.deposit.currency)
  }

  private convertToUSD(amount: number, currency: string): number {
    switch (currency) {
      case 'BTC':
        return amount * this.prices.btc
      case 'ETH':
        return amount * this.prices.eth
      case 'USDC':
      case 'USDT':
        return amount
      default:
        throw new Error(`Unsupported currency: ${currency}`)
    }
  }

  private convertFromUSD(usdAmount: number, currency: string): number {
    switch (currency) {
      case 'BTC':
        return usdAmount / this.prices.btc
      case 'ETH':
        return usdAmount / this.prices.eth
      case 'USDC':
      case 'USDT':
        return usdAmount
      default:
        throw new Error(`Unsupported currency: ${currency}`)
    }
  }

  calculatePosition(htrPriceChangePercent: number): CalculationResult {
    // Calculate new HTR price based on percentage change
    const htrChange = htrPriceChangePercent / 100
    const endHtrPrice = this.prices.htr * (1 + htrChange)

    // Calculate starting balances
    const startingUsdtBalance = this.liquidityValueUSD
    const startingHtrBalance = this.liquidityValueUSD / this.prices.htr

    // Calculate constant product (k)
    const k = startingUsdtBalance * startingHtrBalance

    // Calculate new token amounts based on constant product formula
    const newHtrBalance = Math.sqrt(k / endHtrPrice)
    const newUsdtBalance = k / newHtrBalance

    // Calculate DEX fees
    const usdtDexFees = newUsdtBalance * (this.config.dexFees / 100)

    // Calculate USDT deficit for IL protection
    const usdtDeficit = Math.max(0, this.liquidityValueUSD - newUsdtBalance)

    // Calculate IL protection in HTR
    const htrIlProtection = usdtDeficit / endHtrPrice

    // Calculate LP value in USD
    const lpValue = newUsdtBalance + newHtrBalance * endHtrPrice

    // Calculate bonus values
    const hodlBonus = this.config.bonusValue * (1 + htrChange)
    const sellBonus = this.config.bonusValue

    // Calculate final positions including bonus
    const finalUsdHodl = lpValue + hodlBonus
    const finalUsdSell = lpValue + sellBonus

    // Convert final LP value back to original currency
    const lpValueInOriginalCurrency = this.convertFromUSD(lpValue, this.config.deposit.currency)

    // Calculate percentage deltas
    const baseValue = this.liquidityValueUSD
    const vsUsdtHodlPercent = (finalUsdHodl / baseValue - 1) * 100
    const hodlPercent = (finalUsdHodl / baseValue - 1) * 100
    const sellPercent = (finalUsdSell / baseValue - 1) * 100

    return {
      priceChange: htrPriceChangePercent,
      inputCurrency: {
        currency: this.config.deposit.currency,
        amount: this.config.deposit.amount,
        usdValue: this.liquidityValueUSD,
      },
      endPrice: {
        usdt: 1,
        htrChange: htrPriceChangePercent,
        htrPrice: endHtrPrice,
        htrBonus: this.config.bonusValue,
      },
      startingBalances: {
        htr: startingHtrBalance,
        usdt: startingUsdtBalance,
      },
      endingPoolBalances: {
        usdt: newUsdtBalance,
        htr: newHtrBalance,
        usdtDexFees,
        usdtDeficit,
      },
      endingLPWithdraw: {
        usdt: newUsdtBalance,
        htrIlProtection,
        lpValue,
        originalCurrency: lpValueInOriginalCurrency,
      },
      plusBonus: {
        hodl: hodlBonus,
        sell: sellBonus,
      },
      percentageDelta: {
        vsUsdtHodl: vsUsdtHodlPercent,
        hodl: hodlPercent,
        sell: sellPercent,
      },
    }
  }

  generateAnalysis(minChange: number = -98, maxChange: number = 5000, step: number = 10): CalculationResult[] {
    const results: CalculationResult[] = []

    for (let change = minChange; change <= maxChange; change += step) {
      results.push(this.calculatePosition(change))
    }

    return results
  }
}

// Example usage:
const calculator = new MultiCurrencyLiquidityCalculator(
  {
    htr: 0.07,
    btc: 98520,
    eth: 3339,
    usdc: 1,
    usdt: 1,
  },
  {
    deposit: {
      amount: 0.102, // Depositing 0.102 BTC
      currency: 'BTC',
    },
    holdPeriod: 12,
    bonusValue: 2000,
    dexFees: 25,
  }
)

// Calculate for specific price changes
const resultMinus50 = calculator.calculatePosition(-50) // -50% price change

// Example test cases with different deposit currencies:
const btcTest = calculator.calculatePosition(-90)
console.log('Test case (-90% price change with BTC deposit):', {
  'Input Amount (BTC)': btcTest.inputCurrency.amount,
  'USD Value': btcTest.inputCurrency.usdValue,
  'End HTR Price': btcTest.endPrice.htrPrice,
  'LP Value (USD)': btcTest.endingLPWithdraw.lpValue,
  'LP Value (BTC)': btcTest.endingLPWithdraw.originalCurrency,
  'HODL Return %': btcTest.percentageDelta.hodl,
  'Sell Return %': btcTest.percentageDelta.sell,
})
