from typing import NamedTuple

from hathor import (
    Context,
    BlueprintId,
    Blueprint,
    BlueprintId,
    CallerId,
    HATHOR_TOKEN_UID,
    NCFail,
    Address,
    Amount,
    Timestamp,
    ContractId,
    TokenUid,
    NCAction,
    NCActionType,
    NCDepositAction,
    NCWithdrawalAction,
    export,
    public,
    view,
)

MIN_DEPOSIT = 10000_00
PRECISION = 10**20
PRICE_PRECISION = 10**8  # For decimal price handling (8 decimal places)
MONTHS_IN_SECONDS = 60*60*24*30
MIN_TIMELOCK_AFTER_DEPOSIT = 4 * MONTHS_IN_SECONDS  # 4 months minimum lock after any deposit

class UserPositionEntry(NamedTuple):
    """Initial position entry data for a user deposit."""

    htr_price_in_deposit: Amount
    token_price_in_htr_in_deposit: Amount
    withdrawal_time: int

EMPTY_USER_POSITION = UserPositionEntry(Amount(0), Amount(0), 0)

class OasisUserInfo(NamedTuple):
    """Detailed information about a user's position in the Oasis contract."""

    user_deposit_b: Amount  # Total amount of token_b deposited by the user
    user_liquidity: Amount  # User's share of the total liquidity pool
    user_withdrawal_time: int  # Timestamp when the user can withdraw (timelock expiration)
    oasis_htr_balance: Amount  # Total HTR balance held by the Oasis contract
    total_liquidity: Amount  # Total liquidity in the Oasis pool
    user_balance_a: Amount  # User's HTR balance from bonuses and cashback
    user_balance_b: Amount  # User's token_b balance from cashback
    closed_balance_a: Amount  # HTR available for withdrawal after position closed
    closed_balance_b: Amount  # Token_b available for withdrawal after position closed
    user_lp_b: Amount  # User's token_b amount in the liquidity pool
    user_lp_htr: Amount  # User's HTR amount in the liquidity pool
    max_withdraw_b: Amount  # Maximum token_b that can be withdrawn
    max_withdraw_htr: Amount  # Maximum HTR that can be withdrawn
    htr_price_in_deposit: Amount  # HTR price at the time of deposit (for IL calculation)
    token_price_in_htr_in_deposit: Amount  # Token_b price in HTR at deposit (for IL calculation)
    position_closed: bool  # Whether the user's position has been closed


class OasisInfo(NamedTuple):
    """General information about the Oasis contract state."""

    total_liquidity: Amount  # Total liquidity shares in the Oasis pool
    oasis_htr_balance: Amount  # Total HTR balance available in the Oasis contract for bonuses
    token_b: str  # Token UID of the paired token (hex encoded)
    protocol_fee: Amount  # Protocol fee percentage in thousandths (e.g., 50 = 5%)
    dev_deposit_amount: Amount  # Amount of HTR deposited by dev/owner


class OasisQuoteInfo(NamedTuple):
    """Quote information for adding liquidity to Oasis."""

    bonus: Amount
    htr_amount: Amount
    withdrawal_time: int
    has_position: bool
    fee_amount: Amount
    deposit_amount: Amount
    protocol_fee: Amount


class OasisRemoveLiquidityQuote(NamedTuple):
    """Quote information for removing liquidity from Oasis."""

    user_lp_b: Amount
    user_lp_htr: Amount
    max_withdraw_b: Amount
    max_withdraw_htr: Amount
    loss_htr: Amount
    position_closed: bool


class PoolLiquidityInfo(NamedTuple):
    """Liquidity information from the pool manager for Oasis contract."""

    max_withdraw_a: Amount  # HTR amount in the pool
    user_lp_b: Amount  # Token_b amount in the pool


@export
class Oasis(Blueprint):
    """Oasis contract that interacts with Dozer Pool Manager contract."""

    # Version control
    contract_version: str

    dozer_pool_manager: ContractId
    pool_fee: Amount
    protocol_fee: Amount

    owner_address: CallerId
    dev_address: CallerId
    oasis_htr_balance: Amount
    dev_deposit_amount: Amount
    user_deposit_b: dict[CallerId, Amount]
    user_liquidity: dict[CallerId, Amount]
    total_liquidity: Amount
    user_balances: dict[CallerId, dict[TokenUid, Amount]]
    token_b: TokenUid
    # Track if a user's position has been closed and is ready for withdrawal
    user_position_closed: dict[CallerId, bool]
    # Track withdrawn balances separately from cashback/rewards
    closed_position_balances: dict[CallerId, dict[TokenUid, Amount]]
    # Track user position entry (price at deposit, withdrawal time)
    user_position_entry: dict[CallerId, UserPositionEntry]

    @public(allow_deposit=True)
    def initialize(
        self,
        ctx: Context,
        dozer_pool_manager: ContractId,
        token_b: TokenUid,
        pool_fee: Amount,
        protocol_fee: int,
    ) -> None:
        """Initialize the contract with dozer pool manager set."""
        self.contract_version = "1.0.0"
        action = self._get_action(ctx, NCActionType.DEPOSIT, auth=False)

        if action.amount < MIN_DEPOSIT or action.token_uid != HATHOR_TOKEN_UID:
            raise NCFail("Deposit amount too low or token not HATHOR")
        if protocol_fee < 0 or protocol_fee > 1000:
            raise NCFail("Protocol fee must be between 0 and 1000")

        self.token_b = token_b
        self.dev_address = Address(ctx.caller_id)
        self.dozer_pool_manager = dozer_pool_manager
        self.pool_fee = pool_fee
        self.oasis_htr_balance = Amount(action.amount)
        self.dev_deposit_amount = Amount(action.amount)
        self.total_liquidity = Amount(0)
        self.protocol_fee = Amount(protocol_fee)
        self.owner_address = Address(ctx.caller_id)

        # Initialize all dict fields
        self.user_deposit_b = {}
        self.user_liquidity = {}
        self.user_balances = {}
        self.user_position_closed = {}
        self.closed_position_balances = {}
        self.user_position_entry = {}

        self.log.info("Oasis initialized",
                     token_b=token_b.hex(),
                     pool_fee=pool_fee,
                     protocol_fee=protocol_fee,
                     dev_deposit=action.amount)

    def _get_pool_key(self) -> str:
        """Generate the pool key for the HTR/token_b pair.

        Token ordering must match DozerPoolManager's convention: tokens are sorted
        lexicographically by their UID bytes to ensure consistent pool identification.
        """
        token_a = TokenUid(HATHOR_TOKEN_UID)
        token_b = self.token_b

        # Ensure tokens are ordered lexicographically (smaller UID first)
        if token_a > token_b:
            token_a, token_b = token_b, token_a

        return f"{token_a.hex()}/{token_b.hex()}/{self.pool_fee}"

    @public(allow_deposit=True)
    def owner_deposit(self, ctx: Context) -> None:
        action = self._get_token_action(ctx, NCActionType.DEPOSIT, TokenUid(HATHOR_TOKEN_UID), auth=False)

        if Address(ctx.caller_id) not in [self.dev_address, self.owner_address]:
            raise NCFail("Only dev or owner can deposit")
        if action.token_uid != HATHOR_TOKEN_UID:
            raise NCFail("Deposit token not HATHOR")

        self.oasis_htr_balance = Amount(self.oasis_htr_balance + action.amount)
        self.dev_deposit_amount = Amount(self.dev_deposit_amount + action.amount)

        self.log.info("Owner deposit",
                     amount=action.amount,
                     new_balance=self.oasis_htr_balance)

    @public(allow_deposit=True)
    def user_deposit(self, ctx: Context, timelock: int) -> None:
        """Deposits token B with a timelock period for bonus rewards.

        Args:
            ctx: Execution context
            timelock: Lock period in months (6, 9, or 12)

        Raises:
            NCFail: If deposit requirements not met or invalid timelock
        """
        caller = Address(ctx.caller_id)
        action = self._get_token_action(
            ctx, NCActionType.DEPOSIT, self.token_b, auth=False
        )

        if action.token_uid != self.token_b:
            raise NCFail("Deposit token not B")

        # Multiple deposits are allowed before closing. However, once a position is closed,
        # new deposits are blocked to prevent the complexity of mixing closed withdrawal
        # balances with new active liquidity. Users must fully withdraw before depositing again.
        if self.user_position_closed.get(caller, False):
            raise NCFail("Need to withdraw before making a new deposit")

        # Get HTR price in USD from the DozerPoolManager
        htr_price = self._get_pool_manager().view().get_token_price_in_usd(HATHOR_TOKEN_UID)

        if htr_price == 0:
            raise NCFail("HTR price not available from pool manager")

        # Calculate and deduct protocol fee
        amount = action.amount
        fee_amount = (amount * self.protocol_fee) // 1000
        deposit_amount = Amount(amount - fee_amount)

        self.log.debug("Fee and bonus calculation",
                       original_amount=amount,
                       fee_amount=fee_amount,
                       deposit_amount=deposit_amount,
                       htr_price=htr_price)

        # Add fee to dev balances
        self._add_user_balance(Address(self.dev_address), self.token_b, Amount(fee_amount))

        # Continue with deposit using reduced amount
        htr_amount = self._quote_add_liquidity_in(deposit_amount)
        token_price_in_htr = (deposit_amount * PRICE_PRECISION) // htr_amount if htr_amount > 0 else 0
        bonus = self._get_user_bonus(timelock, htr_amount)

        now = ctx.block.timestamp
        if htr_amount + bonus > self.oasis_htr_balance:
            raise NCFail("Not enough balance")

        if self.total_liquidity == 0:
            liquidity_increase = Amount(deposit_amount * PRECISION)
        else:
            oasis_lp_amount_b = self._get_oasis_lp_amount_b()
            assert oasis_lp_amount_b > 0, "Oasis has no token_b liquidity on pool"

            liquidity_increase = Amount(
                self.total_liquidity * deposit_amount // oasis_lp_amount_b
            )

        self.user_liquidity[caller] = Amount(
            self.user_liquidity.get(caller, 0) + liquidity_increase
        )
        self.total_liquidity = Amount(self.total_liquidity + liquidity_increase)

        # Calculate withdrawal time using helper
        withdrawal_time = self._calculate_new_withdrawal_time(
            caller, Timestamp(now), timelock, deposit_amount
        )

        # Update position entry prices with weighted average if existing position
        if caller in self.user_position_entry:
            old_deposit = self.user_deposit_b[caller]

            new_htr_price = Amount(
                self._calculate_weighted_average(
                    self.user_position_entry[caller].htr_price_in_deposit,
                    old_deposit,
                    htr_price,
                    deposit_amount
                )
            )
            new_token_price = Amount(
                self._calculate_weighted_average(
                    self.user_position_entry[caller].token_price_in_htr_in_deposit,
                    old_deposit,
                    token_price_in_htr,
                    deposit_amount
                )
            )
        else:
            new_htr_price = htr_price
            new_token_price = Amount(token_price_in_htr)

        # Store as NamedTuple
        self.user_position_entry[caller] = UserPositionEntry(
            htr_price_in_deposit=new_htr_price,
            token_price_in_htr_in_deposit=new_token_price,
            withdrawal_time=withdrawal_time
        )

        self.oasis_htr_balance = Amount(self.oasis_htr_balance - bonus - htr_amount)
        self._add_user_balance(caller, TokenUid(HATHOR_TOKEN_UID), bonus)
        self.user_deposit_b[caller] = Amount(
            self.user_deposit_b.get(caller, 0) + deposit_amount
        )

        self.log.info("User deposit completed",
                     deposit_amount=deposit_amount,
                     htr_amount=htr_amount,
                     bonus=bonus,
                     withdrawal_time=withdrawal_time,
                     liquidity_increase=liquidity_increase)

        actions:list[NCAction] = [
            NCDepositAction(amount=deposit_amount, token_uid=self.token_b),
            NCDepositAction(amount=htr_amount, token_uid=TokenUid(HATHOR_TOKEN_UID))
        ]

        # Returns tuple: (token_uid: TokenUid, cashback_amount: Amount)
        token_uid, cashback_amount = self._get_pool_manager().public(*actions).add_liquidity(self.pool_fee)

        if cashback_amount > 0:  # If there's cashback amount
            self.log.debug("Cashback received",
                          token=token_uid.hex(),
                          amount=cashback_amount)

            if token_uid == self.token_b:
                adjust_actions:list[NCAction] = [
                    NCWithdrawalAction(amount=0, token_uid=TokenUid(HATHOR_TOKEN_UID)),
                    NCWithdrawalAction(amount=cashback_amount, token_uid=self.token_b),
                ]
            else:
                adjust_actions = [
                    NCWithdrawalAction(amount=cashback_amount, token_uid=TokenUid(HATHOR_TOKEN_UID)),
                    NCWithdrawalAction(amount=0, token_uid=self.token_b),
                ]
            self._get_pool_manager().public(*adjust_actions).withdraw_cashback(self._get_pool_key())
            self._add_user_balance(caller, token_uid, cashback_amount)

    @public(allow_withdrawal=True)
    def close_position(self, ctx: Context) -> None:
        """Close a user's position, removing liquidity from the pool and making funds available for withdrawal.

        Args:
            ctx: Execution context

        Raises:
            NCFail: If position is still locked or already closed
        """
        caller = Address(ctx.caller_id)
        # Verify position can be closed
        withdrawal_time = self.user_position_entry.get(caller, EMPTY_USER_POSITION).withdrawal_time
        if ctx.block.timestamp < withdrawal_time:
            raise NCFail("Position is still locked")

        if self.user_position_closed.get(caller, False):
            raise NCFail("Position already closed")

        if self.user_liquidity.get(caller, 0) == 0:
            raise NCFail("No position to close")

        oasis_quote = self._quote_remove_liquidity_oasis()
        htr_oasis_amount = oasis_quote.max_withdraw_a
        user_liquidity = self.user_liquidity.get(caller, 0)

        if self.total_liquidity > 0:
            user_lp_htr = (user_liquidity * htr_oasis_amount) // self.total_liquidity
        else:
            user_lp_htr = 0

        user_lp_b = self._quote_token_b_from_htr(user_lp_htr)

        # Create actions to remove liquidity
        actions:list[NCAction] = [
            NCWithdrawalAction(amount=user_lp_htr, token_uid=TokenUid(HATHOR_TOKEN_UID)),
            NCWithdrawalAction(amount=user_lp_b, token_uid=self.token_b),
        ]

        # Handle impermanent loss calculation
        loss_htr = 0
        # Calculate max withdraw amount including existing balances
        user_token_b_balance = self.user_balances.get(caller, {}).get(
            self.token_b, 0
        )
        max_withdraw_b = user_lp_b + user_token_b_balance
        user_deposit_b = self.user_deposit_b.get(caller, 0)

        self.log.debug("Position close calculations",
                      user_lp_htr=user_lp_htr,
                      user_lp_b=user_lp_b,
                      user_deposit_b=user_deposit_b,
                      max_withdraw_b=max_withdraw_b)

        # Check for impermanent loss
        if user_deposit_b > max_withdraw_b:
            loss = user_deposit_b - max_withdraw_b
            loss_htr = self._calculate_impermanent_loss_compensation(loss, user_lp_htr)
            self.log.warn("Impermanent loss detected",
                         loss_in_token_b=loss,
                         htr_compensation=loss_htr)

        # Call dozer pool manager to remove liquidity
        self._get_pool_manager().public(*actions).remove_liquidity(self.pool_fee)

        # Get existing cashback balances
        user_current_balance = self.user_balances.get(caller, {})
        user_htr_current_balance = Amount(user_current_balance.get(TokenUid(HATHOR_TOKEN_UID), 0))

        # First, return the user_lp_htr back to oasis_htr_balance
        self.oasis_htr_balance = Amount(self.oasis_htr_balance + user_lp_htr - loss_htr)

        # Then update closed balances without adding user_lp_htr again
        closed_balances = self.closed_position_balances.get(caller, {})
        closed_balances[self.token_b] = Amount(closed_balances.get(self.token_b, 0) + user_token_b_balance + user_lp_b)
        closed_balances[TokenUid(HATHOR_TOKEN_UID)] = Amount(closed_balances.get(TokenUid(HATHOR_TOKEN_UID), 0) + user_htr_current_balance + loss_htr)
        self.closed_position_balances[caller] = closed_balances

        # Clear user cashback balances after moving them
        if user_token_b_balance > 0 or user_htr_current_balance > 0:
            user_balance = self.user_balances.get(caller, {})
            user_balance[TokenUid(HATHOR_TOKEN_UID)] = Amount(0)
            user_balance[self.token_b] = Amount(0)
            self.user_balances[caller] = user_balance

        # Mark position as closed
        self.user_position_closed[caller] = True

        # Keep the deposit amounts for reference, but reset liquidity
        self.total_liquidity = Amount(self.total_liquidity - self.user_liquidity[caller])
        del self.user_liquidity[caller]
        del self.user_position_entry[caller]

        self.log.info("Position closed",
                     available_token_b=closed_balances.get(self.token_b, 0),
                     available_htr=closed_balances.get(TokenUid(HATHOR_TOKEN_UID), 0))

    @public(allow_withdrawal=True)
    def user_withdraw(self, ctx: Context) -> None:
        """Withdraw funds after position is closed.

        Args:
            ctx: Execution context

        Raises:
            NCFail: If position is not closed or insufficient funds
        """
        action_token_b = self._get_token_action(
            ctx, NCActionType.WITHDRAWAL, self.token_b
        )
        action_htr = None
        if len(ctx.actions) > 1:
            action_htr = self._get_token_action(ctx, NCActionType.WITHDRAWAL, TokenUid(HATHOR_TOKEN_UID))

        # Check if the position is unlocked
        withdrawal_time = self.user_position_entry.get(Address(ctx.caller_id), EMPTY_USER_POSITION).withdrawal_time
        if ctx.block.timestamp < withdrawal_time:
            raise NCFail("Withdrawal locked")

        # For positions that haven't been closed yet, automatically close them first
        if (
            not self.user_position_closed.get(Address(ctx.caller_id), False)
            and self.user_liquidity.get(Address(ctx.caller_id), 0) > 0
        ):
            raise NCFail("Position must be closed before withdrawal")

        # Check token_b withdrawal amount from closed_position_balances
        available_token_b = self.closed_position_balances.get(Address(ctx.caller_id), {}).get(
            self.token_b, 0
        )
        if action_token_b.amount > available_token_b:
            raise NCFail(
                f"Not enough balance. Available: {available_token_b}, Requested: {action_token_b.amount}"
            )

        # Update token_b balance in closed_position_balances
        closed_balances = self.closed_position_balances.get(Address(ctx.caller_id), {})
        closed_balances[self.token_b] = Amount(available_token_b - action_token_b.amount)

        # Check HTR withdrawal if requested
        if action_htr:
            available_htr = self.closed_position_balances.get(Address(ctx.caller_id), {}).get(
                TokenUid(HATHOR_TOKEN_UID), Amount(0)
            )
            if action_htr.amount > available_htr:
                raise NCFail(
                    f"Not enough HTR balance. Available: {available_htr}, Requested: {action_htr.amount}"
                )

            closed_balances[TokenUid(HATHOR_TOKEN_UID)] = Amount(available_htr - action_htr.amount)

        # Update closed position balances
        self.closed_position_balances[Address(ctx.caller_id)] = closed_balances

        htr_withdrawn = action_htr.amount if action_htr else 0
        self.log.info("User withdrawal",
                     token_b_amount=action_token_b.amount,
                     htr_amount=htr_withdrawn,
                     remaining_token_b=closed_balances.get(self.token_b, 0),
                     remaining_htr=closed_balances.get(TokenUid(HATHOR_TOKEN_UID), 0))

        # If all funds withdrawn, clean up user data
        if (
            closed_balances.get(self.token_b, 0) == 0
            and closed_balances.get(TokenUid(HATHOR_TOKEN_UID), 0) == 0
        ):
            del self.user_deposit_b[Address(ctx.caller_id)]
            del self.user_position_entry[Address(ctx.caller_id)]
            del self.user_position_closed[Address(ctx.caller_id)]

    @public(allow_withdrawal=True)
    def user_withdraw_bonus(self, ctx: Context) -> None:
        action = self._get_action(ctx, NCActionType.WITHDRAWAL, auth=False)
        if action.token_uid != HATHOR_TOKEN_UID:
            raise NCFail("Withdrawal token not HATHOR")

        available_bonus = self.user_balances.get(Address(ctx.caller_id), {HATHOR_TOKEN_UID: 0}).get(
            HATHOR_TOKEN_UID, 0
        )
        if action.amount > available_bonus:
            raise NCFail("Withdrawal amount too high")

        self._add_user_balance(Address(ctx.caller_id), TokenUid(HATHOR_TOKEN_UID), Amount(-action.amount))

        self.log.info("Bonus withdrawal",
                     amount=action.amount,
                     remaining=available_bonus - action.amount)

    @public
    def update_protocol_fee(self, ctx: Context, new_fee: int) -> None:
        """Update the protocol fee percentage (in thousandths).

        Args:
            ctx: Execution context
            new_fee: New fee value in thousandths (e.g. 500 = 0.5%)

        Raises:
            NCFail: If caller is not dev or fee exceeds maximum
        """
        if Address(ctx.caller_id) != self.dev_address:
            raise NCFail("Only dev can update protocol fee")
        if new_fee > 1000 or new_fee < 0:
            raise NCFail(f"Protocol fee out of range: {new_fee} (must be between 0 and 1000)")

        old_fee = self.protocol_fee
        self.protocol_fee = Amount(new_fee)

        self.log.info("Protocol fee updated",
                     old_fee=old_fee,
                     new_fee=new_fee)

    def _get_pool_manager(self):
        """Helper method to get the Dozer Pool Manager contract instance."""
        return self.syscall.get_contract(
            self.dozer_pool_manager, blueprint_id=None
        )

    def _get_oasis_lp_amount_b(self) -> Amount:
        # Get user info for this contract from the pool manager
        pool_key = self._get_pool_key()
        user_info = self._get_pool_manager().view().user_info(
            self.syscall.get_contract_id(),
            pool_key
        )
        return user_info.token1Amount  # token_b amount

    def _quote_add_liquidity_in(self, amount: Amount) -> Amount:
        pool_key = self._get_pool_key()
        return self._get_pool_manager().view().front_quote_add_liquidity_in(
            amount, self.token_b, pool_key
        )

    def _quote_remove_liquidity_oasis(self) -> PoolLiquidityInfo:
        # Get user info for this contract from the pool manager
        pool_key = self._get_pool_key()
        user_info = self._get_pool_manager().view().user_info(
            self.syscall.get_contract_id(),
            pool_key
        )
        return PoolLiquidityInfo(
            max_withdraw_a=user_info.token0Amount,  # HTR amount
            user_lp_b=user_info.token1Amount,       # token_b amount
        )

    def _calculate_weighted_average(
        self, old_value: int, old_weight: int, new_value: int, new_weight: int
    ) -> int:
        """Calculate weighted average of two values.

        Args:
            old_value: Previous value
            old_weight: Weight of previous value (e.g., old deposit amount)
            new_value: New value to incorporate
            new_weight: Weight of new value (e.g., new deposit amount)

        Returns:
            Weighted average: (old_value * old_weight + new_value * new_weight) / (old_weight + new_weight)
        """
        result = (old_value * old_weight + new_value * new_weight) // (old_weight + new_weight)
        self.log.debug("Weighted average calculation",
                       old_value=old_value,
                       old_weight=old_weight,
                       new_value=new_value,
                       new_weight=new_weight,
                       result=result)
        return result

    def _calculate_new_withdrawal_time(
        self,
        address: Address,
        now: Timestamp,
        timelock: int,
        deposit_amount: Amount
    ) -> int:
        """Calculate withdrawal time for a deposit considering existing position with minimum timelock floor.

        Args:
            address: User address
            now: Current timestamp
            timelock: New deposit timelock in months
            deposit_amount: Amount being deposited (after fees)

        Returns:
            Unix timestamp when withdrawal will be allowed
        """
        if address in self.user_position_entry:
            existing_withdrawal_time = self.user_position_entry[address].withdrawal_time
            delta = existing_withdrawal_time - now

            if delta > 0:
                # Calculate weighted average withdrawal time
                old_deposit = self.user_deposit_b[address]
                new_timelock_seconds = timelock * MONTHS_IN_SECONDS
                weighted_time = self._calculate_weighted_average(
                    delta, old_deposit, new_timelock_seconds, deposit_amount
                )
                new_withdrawal_time = int(now + weighted_time + 1)

                # SECURITY: Enforce minimum timelock period after any deposit
                # If weighted average falls below the minimum, use the minimum instead
                minimum_withdrawal_time = int(now + MIN_TIMELOCK_AFTER_DEPOSIT)
                if new_withdrawal_time < minimum_withdrawal_time:
                    self.log.debug("Withdrawal time adjusted to minimum",
                                  calculated=new_withdrawal_time,
                                  minimum=minimum_withdrawal_time,
                                  enforced=minimum_withdrawal_time)
                    return minimum_withdrawal_time
                return new_withdrawal_time
            else:
                # Position already unlocked, use new timelock
                return int(now + timelock * MONTHS_IN_SECONDS)
        else:
            # First deposit
            return int(now + timelock * MONTHS_IN_SECONDS)

    def _get_user_bonus(self, timelock: int, amount: Amount) -> Amount:
        """Calculates the bonus for a user based on the timelock and amount"""
        if timelock not in [6, 9, 12]:  # Assuming these are the only valid values
            raise NCFail("Invalid timelock value")
        # Using integer calculations with basis points (10000 = 100%)
        # 6 months = 10% = 1000 basis points
        # 9 months = 15% = 1500 basis points
        # 12 months = 20% = 2000 basis points
        bonus_multiplier = {6: 1000, 9: 1500, 12: 2000}

        return Amount((amount * bonus_multiplier[timelock]) // 10000)

    def _calculate_impermanent_loss_compensation(
        self, loss_in_token_b: int, user_lp_htr: int
    ) -> int:
        """Calculate HTR compensation for impermanent loss in token_b.

        Args:
            loss_in_token_b: Amount of token_b loss
            user_lp_htr: User's HTR in liquidity pool (max compensation)

        Returns:
            HTR amount to compensate for loss (capped at user_lp_htr)
        """
        pool_manager = self._get_pool_manager()
        reserves = pool_manager.view().get_reserves(HATHOR_TOKEN_UID, self.token_b, self.pool_fee)
        loss_htr = pool_manager.view().quote(loss_in_token_b, reserves[1], reserves[0])

        # Cap compensation at available HTR
        if loss_htr > user_lp_htr:
            self.log.debug("IL compensation capped",
                          calculated_loss_htr=loss_htr,
                          user_lp_htr=user_lp_htr,
                          capped_compensation=user_lp_htr)
            loss_htr = user_lp_htr

        return loss_htr

    def _quote_token_b_from_htr(self, user_lp_htr: int) -> int:
        """Calculate token_b amount from HTR amount using pool reserves with correct token ordering"""
        pool_manager = self._get_pool_manager().view()
        reserves = pool_manager.get_reserves(HATHOR_TOKEN_UID, self.token_b, self.pool_fee)

        return pool_manager.quote(user_lp_htr, reserves[0], reserves[1])

    def _add_user_balance(self, address: Address, token_id: TokenUid, amount: Amount) -> Amount:
        """Add amount to user's balance for a given token.

        Args:
            address: User address
            token_id: Token UID to update
            amount: Amount to add (can be negative for subtraction)

        Returns:
            The new balance after addition
        """
        if address not in self.user_balances:
            self.user_balances[address] = {token_id: amount}
            return amount
        else:
            partial = self.user_balances[address]
            new_value = Amount(partial.get(token_id, 0) + amount)
            partial[token_id] = new_value
            self.user_balances[address] = partial
            return new_value

    @public(allow_withdrawal=True)
    def owner_withdraw(self, ctx: Context) -> None:
        """Allows owner to withdraw HTR from their balance.

        Args:
            ctx: Execution context

        Raises:
            NCFail: If caller is not owner or withdraw amount exceeds available balance
        """
        if Address(ctx.caller_id) != self.owner_address:
            raise NCFail("Only owner can withdraw")
        action = self._get_token_action(
            ctx, NCActionType.WITHDRAWAL, HATHOR_TOKEN_UID, auth=False
        )
        if action.amount > self.oasis_htr_balance:
            raise NCFail("Withdrawal amount too high")
        self.oasis_htr_balance = Amount(self.oasis_htr_balance - action.amount)
        self.dev_deposit_amount = Amount(self.dev_deposit_amount - action.amount)

    @public(allow_withdrawal=True)
    def dev_withdraw_fee(self, ctx: Context) -> None:
        """Allows dev to withdraw collected protocol fees.

        Args:
            ctx: Execution context

        Raises:
            NCFail: If caller is not dev or withdraw amount exceeds available balance
        """
        if Address(ctx.caller_id) != self.dev_address:
            raise NCFail("Only dev can withdraw fees")

        token_b_action = self._get_token_action(
            ctx, NCActionType.WITHDRAWAL, self.token_b
        )
        if token_b_action.amount > self.user_balances.get(self.dev_address, {}).get(
            self.token_b, 0
        ):
            raise NCFail("Withdrawal amount too high")

        self._add_user_balance(Address(self.dev_address), self.token_b, Amount(-token_b_action.amount))

    @public
    def update_owner_address(self, ctx: Context, new_owner: Address) -> None:
        """Updates the owner address. Can be called by dev or current owner.

        Args:
            ctx: Execution context
            new_owner: New owner address

        Raises:
            NCFail: If caller is not dev or current owner
        """
        if Address(ctx.caller_id) not in [self.dev_address, self.owner_address]:
            raise NCFail("Only dev or owner can update owner address")
        self.owner_address = new_owner

    def _get_action(
        self, ctx: Context, action_type: NCActionType, auth: bool
    ) -> NCDepositAction | NCWithdrawalAction:
        """Returns one HTR action, validated by type. Wrapper around _get_token_action."""
        if len(ctx.actions) != 1:
            raise NCFail("Expected exactly 1 action")
        return self._get_token_action(ctx, action_type, TokenUid(HATHOR_TOKEN_UID), auth)

    def _get_token_action(
        self,
        ctx: Context,
        action_type: NCActionType,
        token: TokenUid,
        auth: bool = False,
    ) -> NCDepositAction | NCWithdrawalAction:
        """Returns one action for the specified token, validated by type."""
        if len(ctx.actions) > 2:
            raise NCFail("Too many actions (max 2)")

        output = ctx.get_single_action(token)
        if not output:
            raise NCFail(f"No action found for token {token.hex()}")
        if output.type != action_type:
            raise NCFail(f"Wrong action type: expected {action_type}, got {output.type}")
        if auth and Address(ctx.caller_id) != self.dev_address:
            raise NCFail("Unauthorized: only dev can perform this action")

        # Type assertion: get_single_action returns the correct type based on action_type
        if isinstance(output, (NCDepositAction, NCWithdrawalAction)):
            return output
        raise NCFail("Invalid action type")

    @view
    def user_info(
        self,
        address: Address,
    ) -> OasisUserInfo:
        remove_liquidity_oasis_quote = self.get_remove_liquidity_oasis_quote(address)

        # Safely access nested dicts using 'in' check to avoid state changes
        user_balance_a = 0
        if address in self.user_balances:
            user_balance_a = self.user_balances[address].get(HATHOR_TOKEN_UID, 0)

        user_balance_b = 0
        if address in self.user_balances:
            user_balance_b = self.user_balances[address].get(self.token_b, 0)

        closed_balance_a = 0
        if address in self.closed_position_balances:
            closed_balance_a = self.closed_position_balances[address].get(HATHOR_TOKEN_UID, 0)

        closed_balance_b = 0
        if address in self.closed_position_balances:
            closed_balance_b = self.closed_position_balances[address].get(self.token_b, 0)

        # Get position entry data
        position_entry = self.user_position_entry.get(address, EMPTY_USER_POSITION)

        return OasisUserInfo(
            user_deposit_b=Amount(self.user_deposit_b.get(address, 0)),
            user_liquidity=Amount(self.user_liquidity.get(address, 0)),
            user_withdrawal_time=position_entry.withdrawal_time,
            oasis_htr_balance=self.oasis_htr_balance,
            total_liquidity=self.total_liquidity,
            user_balance_a=Amount(user_balance_a),
            user_balance_b=Amount(user_balance_b),
            closed_balance_a=Amount(closed_balance_a),
            closed_balance_b=Amount(closed_balance_b),
            user_lp_b=Amount(remove_liquidity_oasis_quote.user_lp_b),
            user_lp_htr=Amount(remove_liquidity_oasis_quote.user_lp_htr),
            max_withdraw_b=Amount(remove_liquidity_oasis_quote.max_withdraw_b),
            max_withdraw_htr=Amount(remove_liquidity_oasis_quote.max_withdraw_htr),
            htr_price_in_deposit=position_entry.htr_price_in_deposit,
            token_price_in_htr_in_deposit=position_entry.token_price_in_htr_in_deposit,
            position_closed=self.user_position_closed.get(address, False),
        )

    @view
    def oasis_info(self) -> OasisInfo:
        return OasisInfo(
            total_liquidity=self.total_liquidity,
            oasis_htr_balance=self.oasis_htr_balance,
            token_b=self.token_b.hex(),
            protocol_fee=self.protocol_fee,
            dev_deposit_amount=self.dev_deposit_amount,
        )

    @view
    def front_quote_add_liquidity_in(
        self, amount: int, timelock: int, now: Timestamp, address: Address
    ) -> OasisQuoteInfo:
        """Calculates the bonus for a user based on the timelock and amount"""
        fee_amount = (amount * self.protocol_fee) // 1000
        deposit_amount = Amount(amount - fee_amount)

        htr_amount = self._quote_add_liquidity_in(deposit_amount)
        bonus = self._get_user_bonus(timelock, htr_amount)

        # Calculate withdrawal time using helper
        withdrawal_time = self._calculate_new_withdrawal_time(
            address, now, timelock, deposit_amount
        )

        return OasisQuoteInfo(
            bonus=bonus,
            htr_amount=htr_amount,
            withdrawal_time=withdrawal_time,
            has_position=address in self.user_position_entry,
            fee_amount=Amount(fee_amount),
            deposit_amount=deposit_amount,
            protocol_fee=self.protocol_fee,
        )

    @view
    def get_remove_liquidity_oasis_quote(
        self, address: Address
    ) -> OasisRemoveLiquidityQuote:
        # If position is already closed, return the available balances from closed_position_balances
        if self.user_position_closed.get(address, False):
            return OasisRemoveLiquidityQuote(
                user_lp_b=Amount(0),
                user_lp_htr=Amount(0),
                max_withdraw_b=Amount(self.closed_position_balances.get(address, {}).get(
                    self.token_b, 0
                )),
                max_withdraw_htr=Amount(self.closed_position_balances.get(address, {}).get(
                    HATHOR_TOKEN_UID, 0
                )),
                loss_htr=Amount(0),
                position_closed=True,
            )

        # Otherwise calculate withdrawal amounts based on current pool state
        oasis_quote = self._quote_remove_liquidity_oasis()
        htr_oasis_amount = oasis_quote.max_withdraw_a
        user_liquidity = self.user_liquidity.get(address, 0)

        if self.total_liquidity > 0:
            user_lp_htr = (user_liquidity) * htr_oasis_amount // (self.total_liquidity)
        else:
            user_lp_htr = 0

        user_lp_b = self._quote_token_b_from_htr(user_lp_htr)

        # Calculate total available amounts including existing balances
        user_balance_b = self.user_balances.get(address, {}).get(self.token_b, 0)
        user_balance_htr = self.user_balances.get(address, {}).get(HATHOR_TOKEN_UID, 0)
        max_withdraw_b = user_lp_b + user_balance_b

        # Calculate impermanent loss compensation if needed
        loss_htr = 0
        if self.user_deposit_b.get(address, 0) > max_withdraw_b:
            loss = self.user_deposit_b.get(address, 0) - max_withdraw_b
            loss_htr = self._calculate_impermanent_loss_compensation(loss, user_lp_htr)
            max_withdraw_htr = user_balance_htr + loss_htr
        else:
            max_withdraw_htr = user_balance_htr

        return OasisRemoveLiquidityQuote(
            user_lp_b=Amount(user_lp_b),
            user_lp_htr=Amount(user_lp_htr),
            max_withdraw_b=Amount(max_withdraw_b),
            max_withdraw_htr=Amount(max_withdraw_htr),
            loss_htr=Amount(loss_htr),
            position_closed=False,
        )


    @public
    def upgrade_contract(self, ctx: Context, new_blueprint_id: BlueprintId, new_version: str) -> None:
        """Upgrade the contract to a new blueprint version.

        Args:
            ctx: Transaction context
            new_blueprint_id: The blueprint ID to upgrade to
            new_version: Version string for the new blueprint (e.g., "1.1.0")

        Raises:
            NCFail: If caller is not the owner
        """
        # Only owner can upgrade
        if ctx.caller_id != self.owner_address:
            raise NCFail("Only owner can upgrade contract")

        # Validate version is newer
        if not self._is_version_higher(new_version, self.contract_version):
            raise InvalidVersion(f"New version {new_version} must be higher than current {self.contract_version}")

        old_version = self.contract_version
        self.contract_version = new_version

        self.log.info("Contract upgrade",
                     old_version=old_version,
                     new_version=new_version,
                     new_blueprint_id=new_blueprint_id.hex())

        # Perform the upgrade
        self.syscall.change_blueprint(new_blueprint_id)

        
    def _parse_version(self, version: str) -> tuple[int, int, int] | None:
        """Parse a semantic version string into a tuple of integers.

        Args:
            version: Version string (e.g., "1.2.3")

        Returns:
            Tuple of (major, minor, patch) or None if invalid
        """
        parts_str = version.split('.')
        parts: list[int] = []

        for part in parts_str:
            # Check if all characters are digits
            if not part or not all(c in '0123456789' for c in part):
                return None  # Invalid format
            parts.append(int(part))

        # Pad with zeros if needed (e.g., "1.0" becomes "1.0.0")
        while len(parts) < 3:
            parts.append(0)

        return (parts[0], parts[1], parts[2])

    def _is_version_higher(self, new_version: str, current_version: str) -> bool:
        """Compare semantic versions (e.g., "1.2.3").

        Returns True if new_version > current_version.
        Returns False if versions are malformed or equal.
        """
        new_parts = self._parse_version(new_version)
        current_parts = self._parse_version(current_version)

        if new_parts is None or current_parts is None:
            return False  # Invalid format

        return new_parts > current_parts

    @view
    def get_contract_version(self) -> str:
        """Get the current contract version.

        Returns:
            Version string (e.g., "1.0.0")
        """
        return self.contract_version



class InvalidVersion(NCFail):
    pass
