import { OasisInterface } from '../components/OasisUserPosition'

// Function to update oasis position optimistically for bonus withdrawal
export const editOasisBonusOnWithdraw = (allUserOasisList: OasisInterface[] | undefined, oasisId: string) => {
  if (!allUserOasisList) return allUserOasisList

  return allUserOasisList.map((oasis) => {
    if (oasis.id === oasisId) {
      // Calculate new max_withdraw_htr by subtracting the bonus
      const bonusAmount = oasis.user_balance_a || 0
      const newMaxWithdrawHtr = Math.max(0, oasis.max_withdraw_htr - bonusAmount)

      // Create a new object with bonus zeroed out to avoid reference issues
      return {
        ...oasis,
        user_balance_a: 0,
        max_withdraw_htr: newMaxWithdrawHtr,
      }
    }
    return oasis
  })
}

// Function to update oasis position optimistically for position withdrawal
export const editOasisOnWithdraw = (allUserOasisList: OasisInterface[] | undefined, oasisId: string) => {
  if (!allUserOasisList) return allUserOasisList

  // Filter out the position entirely instead of just marking it as closed
  return allUserOasisList.filter((oasis) => oasis.id !== oasisId)
}

// Function to update oasis position optimistically for adding liquidity to an existing position
export const editOasisOnAdd = (
  allUserOasisList: OasisInterface[] | undefined,
  oasisId: string,
  addAmount: number,
  addBonus: number,
  addHtrMatch: number,
  newUnlockDate: Date,
  htrPrice: number
) => {
  if (!allUserOasisList) return allUserOasisList

  return allUserOasisList.map((oasis) => {
    if (oasis.id === oasisId) {
      // Create a new object with updated values using data from getFrontQuoteLiquidityIn
      return {
        ...oasis,
        // Update deposit amount with depositAmount from the API response
        user_deposit_b: oasis.user_deposit_b + addAmount,
        // Update bonus balance (this is the value from bonus in the API response)
        user_balance_a: oasis.user_balance_a + addBonus,
        // Update max withdrawable amounts (use depositAmount for token)
        max_withdraw_b: oasis.max_withdraw_b + addAmount,
        // HTR includes matched amount + bonus
        max_withdraw_htr: oasis.max_withdraw_htr + addBonus,
        // Update withdrawal time from API response
        user_withdrawal_time: newUnlockDate,
        // Update LP token amounts (htr_amount from API response)
        user_lp_htr: oasis.user_lp_htr + addHtrMatch,
        user_lp_b: oasis.user_lp_b + addAmount,
        // Keep the existing htr_price_in_deposit and token_price_in_htr_in_deposit
        // as these will be properly updated when the real data comes from the blockchain
        position_closed: false,
      }
    }
    return oasis
  })
}

// Function to update oasis position optimistically for closing a position
export const editOasisOnClose = (allUserOasisList: OasisInterface[] | undefined, oasisId: string) => {
  if (!allUserOasisList) return allUserOasisList

  return allUserOasisList.map((oasis) => {
    if (oasis.id === oasisId) {
      // Mark the position as closed but keep it in the list
      return {
        ...oasis,
        position_closed: true,
      }
    }
    return oasis
  })
}
