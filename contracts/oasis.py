from typing import NamedTuple

from hathor.nanocontracts.context import Context
from hathor.nanocontracts.blueprint import Blueprint
from hathor.nanocontracts.exception import NCFail
from hathor.nanocontracts.types import (
    Address,
    Amount,
    Timestamp,
    ContractId,
    TokenUid,
    NCAction,
    NCActionType,
    NCDepositAction,
    NCWithdrawalAction,
    public,
    view,
)

MIN_DEPOSIT = 10000_00
PRECISION = 10**20
PRICE_PRECISION = 10**8  # For decimal price handling (8 decimal places)
MONTHS_IN_SECONDS = 60
HTR_UID = TokenUid(b'\x00')


class OasisUserInfo(NamedTuple):
    """Detailed information about a user's position in the Oasis contract."""
    
    user_deposit_b: Amount
    user_liquidity: Amount
    user_withdrawal_time: int
    oasis_htr_balance: Amount
    total_liquidity: Amount
    user_balance_a: Amount
    user_balance_b: Amount
    closed_balance_a: Amount
    closed_balance_b: Amount
    user_lp_b: Amount
    user_lp_htr: Amount
    max_withdraw_b: Amount
    max_withdraw_htr: Amount
    htr_price_in_deposit: Amount
    token_price_in_htr_in_deposit: Amount
    position_closed: bool


class OasisInfo(NamedTuple):
    """General information about the Oasis contract state."""
    
    total_liquidity: Amount
    oasis_htr_balance: Amount
    token_b: str
    protocol_fee: Amount
    dev_deposit_amount: Amount


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


class Oasis(Blueprint):
    """Oasis contract that interacts with Dozer Pool Manager contract."""

    dozer_pool_manager: ContractId
    pool_fee: Amount
    protocol_fee: Amount

    owner_address: bytes
    dev_address: bytes
    oasis_htr_balance: Amount
    dev_deposit_amount: Amount
    user_deposit_b: dict[bytes, Amount]
    htr_price_in_deposit: dict[bytes, Amount]
    token_price_in_htr_in_deposit: dict[bytes, Amount]
    user_liquidity: dict[bytes, Amount]
    total_liquidity: Amount
    user_withdrawal_time: dict[bytes, int]
    user_balances: dict[bytes, dict[TokenUid, Amount]]
    token_b: TokenUid
    # Track if a user's position has been closed and is ready for withdrawal
    user_position_closed: dict[bytes, bool]
    # Track withdrawn balances separately from cashback/rewards
    closed_position_balances: dict[bytes, dict[TokenUid, Amount]]

    @public(allow_deposit=True)
    def initialize(
        self,
        ctx: Context,
        dozer_pool_manager: ContractId,
        token_b: TokenUid,
        pool_fee: Amount,
        protocol_fee: Amount,
    ) -> None:
        """Initialize the contract with dozer pool manager set."""
        action = self._get_action(ctx, NCActionType.DEPOSIT, auth=False)
        if action.amount < MIN_DEPOSIT or action.token_uid != HTR_UID:
            raise NCFail("Deposit amount too low or token not HATHOR")
        if protocol_fee < 0 or protocol_fee > 1000:
            raise NCFail("Protocol fee must be between 0 and 1000")
        self.token_b = token_b
        self.dev_address = ctx.address
        self.dozer_pool_manager = dozer_pool_manager
        self.pool_fee = pool_fee
        self.oasis_htr_balance = Amount(action.amount)
        self.dev_deposit_amount = Amount(action.amount)
        self.total_liquidity = Amount(0)
        self.protocol_fee = protocol_fee
        self.owner_address = ctx.address

    def _get_pool_key(self) -> str:
        """Generate the pool key for the HTR/token_b pair."""
        token_a = TokenUid(HTR_UID)
        token_b = self.token_b
        
        # Ensure tokens are ordered (HTR should be smaller)
        if token_a > token_b:
            token_a, token_b = token_b, token_a
            
        return f"{token_a.hex()}/{token_b.hex()}/{self.pool_fee}"

    @public(allow_deposit=True)
    def owner_deposit(self, ctx: Context) -> None:

        action = self._get_token_action(ctx, NCActionType.DEPOSIT, TokenUid(HTR_UID), auth=False)
        if ctx.address not in [self.dev_address, self.owner_address]:
            raise NCFail("Only dev or owner can deposit")
        if action.token_uid != HTR_UID:
            raise NCFail("Deposit token not HATHOR")
        self.oasis_htr_balance = Amount(self.oasis_htr_balance + action.amount)
        self.dev_deposit_amount = Amount(self.dev_deposit_amount + action.amount)

    @public(allow_deposit=True)
    def user_deposit(self, ctx: Context, timelock: int, htr_price: Amount) -> None:
        """Deposits token B with a timelock period for bonus rewards.

        Args:
            ctx: Execution context
            timelock: Lock period in months (6, 9, or 12)
            htr_price: HTR price in USD scaled by PRICE_PRECISION (10^8)

        Raises:
            NCFail: If deposit requirements not met or invalid timelock
        """
        action = self._get_token_action(
            ctx, NCActionType.DEPOSIT, self.token_b, auth=False
        )
        if action.token_uid != self.token_b:
            raise NCFail("Deposit token not B")

        if self.user_position_closed.get(ctx.address, False):
            raise NCFail("Need to close position before deposit")

        # Validate htr_price is properly scaled (should be > 0 and reasonable for USD price)
        if htr_price <= 0:
            raise NCFail("HTR price must be positive")
        if htr_price > 1000 * PRICE_PRECISION:  # Max $1000 per HTR seems reasonable
            raise NCFail("HTR price too high")

        # Calculate and deduct protocol fee
        amount = action.amount
        fee_amount = (amount * self.protocol_fee) // 1000
        deposit_amount = Amount(amount - fee_amount)

        # Add fee to dev balances
        partial = self.user_balances.get(self.dev_address, {})
        partial[self.token_b] = Amount(partial.get(self.token_b, 0) + fee_amount)
        self.user_balances[self.dev_address] = partial

        # Continue with deposit using reduced amount
        htr_amount = self._quote_add_liquidity_in(deposit_amount)
        token_price_in_htr = deposit_amount * PRICE_PRECISION // htr_amount if htr_amount > 0 else 0
        bonus = self._get_user_bonus(timelock, htr_amount)
        now = ctx.timestamp
        if htr_amount + bonus > self.oasis_htr_balance:
            raise NCFail("Not enough balance")

        if self.total_liquidity == 0:
            self.total_liquidity = Amount(deposit_amount * PRECISION)
            self.user_liquidity[ctx.address] = Amount(deposit_amount * PRECISION)
        else:
            liquidity_increase = (
                self.total_liquidity
                * deposit_amount
                // self._get_oasis_lp_amount_b()
            )
            self.user_liquidity[ctx.address] = Amount(
                self.user_liquidity.get(ctx.address, 0) + liquidity_increase
            )
            self.total_liquidity = Amount(self.total_liquidity + liquidity_increase)

        if ctx.address in self.user_withdrawal_time:
            delta = self.user_withdrawal_time[ctx.address] - now
            if delta > 0:
                self.user_withdrawal_time[ctx.address] = int(
                    now
                    + (
                        (
                            (delta * self.user_deposit_b[ctx.address])
                            + (deposit_amount * timelock * MONTHS_IN_SECONDS)
                        )
                        // (deposit_amount + self.user_deposit_b[ctx.address])
                    )
                    + 1
                )
            else:
                self.user_withdrawal_time[ctx.address] = (
                    int(now + int(timelock * int(MONTHS_IN_SECONDS)))
                )
            # updating position intial price with weighted average
            self.htr_price_in_deposit[ctx.address] = Amount(
                (
                    self.htr_price_in_deposit[ctx.address]
                    * self.user_deposit_b[ctx.address]
                    + htr_price * deposit_amount
                )
                // (self.user_deposit_b[ctx.address] + deposit_amount)
            )
            self.token_price_in_htr_in_deposit[ctx.address] = Amount(
                (
                    self.token_price_in_htr_in_deposit[ctx.address]
                    * self.user_deposit_b[ctx.address]
                    + token_price_in_htr * deposit_amount
                )
                // (self.user_deposit_b[ctx.address] + deposit_amount)
            )

        else:
            self.htr_price_in_deposit[ctx.address] = htr_price
            self.token_price_in_htr_in_deposit[ctx.address] = Amount(token_price_in_htr)
            self.user_withdrawal_time[ctx.address] = int(now + timelock * MONTHS_IN_SECONDS)

        self.oasis_htr_balance = Amount(self.oasis_htr_balance - bonus - htr_amount)
        partial = self.user_balances.get(ctx.address, {})
        partial[TokenUid(HTR_UID)] = Amount(partial.get(TokenUid(HTR_UID), 0) + bonus)
       
        self.user_balances[ctx.address] = partial
        self.user_deposit_b[ctx.address] = Amount(
            self.user_deposit_b.get(ctx.address, 0) + deposit_amount
        )

        actions:list[NCAction] = [
            NCDepositAction(amount=deposit_amount, token_uid=self.token_b),
            NCDepositAction(amount=htr_amount, token_uid=TokenUid(HTR_UID))
        ]

        result = self.syscall.call_public_method(self.dozer_pool_manager, "add_liquidity", actions, self.pool_fee)

        if result[1] > 0:
            if result[0] == self.token_b:
                adjust_actions:list[NCAction] = [
                    NCWithdrawalAction(amount=0, token_uid=TokenUid(HTR_UID)),
                    NCWithdrawalAction(amount=result[1], token_uid=self.token_b),
                ]
            else:
                adjust_actions = [
                    NCWithdrawalAction(amount=result[1], token_uid=TokenUid(HTR_UID)),
                    NCWithdrawalAction(amount=0, token_uid=self.token_b),
                ]
            self.syscall.call_public_method(
                self.dozer_pool_manager, "withdraw_cashback", adjust_actions, self.pool_fee
            )
            partial = self.user_balances.get(ctx.address, {})
            partial.update(
                {
                    result[0]: partial.get(result[0], 0) + result[1],
                }
            )
            self.user_balances[ctx.address] = partial

    @public(allow_withdrawal=True)
    def close_position(self, ctx: Context) -> None:
        """Close a user's position, removing liquidity from the pool and making funds available for withdrawal.

        Args:
            ctx: Execution context

        Raises:
            NCFail: If position is still locked or already closed
        """
        # Verify position can be closed
        if ctx.timestamp < self.user_withdrawal_time.get(ctx.address, 0):
            raise NCFail("Position is still locked")

        if self.user_position_closed.get(ctx.address, False):
            raise NCFail("Position already closed")

        if self.user_liquidity.get(ctx.address, 0) == 0:
            raise NCFail("No position to close")

        # Get quote information
        oasis_quote = self._quote_remove_liquidity_oasis()
        htr_oasis_amount = oasis_quote["max_withdraw_a"]
        token_b_oasis_amount = oasis_quote["user_lp_b"]
        user_liquidity = self.user_liquidity.get(ctx.address, 0)
        user_lp_b = user_liquidity * token_b_oasis_amount // self.total_liquidity
        user_lp_htr = user_liquidity * htr_oasis_amount // self.total_liquidity

        # Create actions to remove liquidity
        actions:list[NCAction] = [
            NCWithdrawalAction(amount=user_lp_htr, token_uid=TokenUid(HTR_UID)),
            NCWithdrawalAction(amount=user_lp_b, token_uid=self.token_b),
        ]

        # Handle impermanent loss calculation
        loss_htr = 0
        # Calculate max withdraw amount including existing balances
        user_token_b_balance = self.user_balances.get(ctx.address, {}).get(
            self.token_b, 0
        )
        max_withdraw_b = user_lp_b + user_token_b_balance

        # Check for impermanent loss
        if self.user_deposit_b.get(ctx.address, 0) > max_withdraw_b:
            loss = self.user_deposit_b[ctx.address] - max_withdraw_b
            # Get pool reserves to calculate quote
            reserves = self.syscall.call_view_method(self.dozer_pool_manager, "get_reserves", HTR_UID, self.token_b, self.pool_fee)
            loss_htr = self.syscall.call_view_method(self.dozer_pool_manager, "quote", loss, reserves[1], reserves[0])
            if loss_htr > user_lp_htr:
                loss_htr = user_lp_htr

        # Call dozer pool manager to remove liquidity
        self.syscall.call_public_method(self.dozer_pool_manager, "remove_liquidity", actions, self.pool_fee)

        # Get existing cashback balances
        user_current_balance = self.user_balances.get(ctx.address, {})
        user_htr_current_balance = Amount(user_current_balance.get(TokenUid(HTR_UID), 0))

        # First, return the user_lp_htr back to oasis_htr_balance
        self.oasis_htr_balance = Amount(self.oasis_htr_balance + user_lp_htr - loss_htr)

        # Then update closed balances without adding user_lp_htr again
        closed_balances = self.closed_position_balances.get(ctx.address, {})
        closed_balances[self.token_b] = Amount(closed_balances.get(self.token_b, 0) + user_token_b_balance + user_lp_b)
        closed_balances[TokenUid(HTR_UID)] = Amount(closed_balances.get(TokenUid(HTR_UID), 0) + user_htr_current_balance + loss_htr)
        self.closed_position_balances[ctx.address] = closed_balances

        # Clear user cashback balances after moving them
        if user_token_b_balance > 0 or user_htr_current_balance > 0:
            self.user_balances[ctx.address] = {TokenUid(HTR_UID): Amount(0), self.token_b: Amount(0)}

        # Mark position as closed
        self.user_position_closed[ctx.address] = True

        # Keep the deposit amounts for reference, but reset liquidity
        self.total_liquidity = Amount(self.total_liquidity - self.user_liquidity[ctx.address])
        self.user_liquidity.__delitem__(ctx.address)
        self.user_withdrawal_time.__delitem__(ctx.address)

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
            action_htr = self._get_token_action(ctx, NCActionType.WITHDRAWAL, TokenUid(HTR_UID))

        # Check if the position is unlocked
        if ctx.timestamp < self.user_withdrawal_time.get(ctx.address, 0):
            raise NCFail("Withdrawal locked")

        # For positions that haven't been closed yet, automatically close them first
        if (
            not self.user_position_closed.get(ctx.address, False)
            and self.user_liquidity.get(ctx.address, 0) > 0
        ):
            raise NCFail("Position must be closed before withdrawal")

        # Check token_b withdrawal amount from closed_position_balances
        available_token_b = self.closed_position_balances.get(ctx.address, {}).get(
            self.token_b, 0
        )
        if action_token_b.amount > available_token_b:
            raise NCFail(
                f"Not enough balance. Available: {available_token_b}, Requested: {action_token_b.amount}"
            )

        # Update token_b balance in closed_position_balances
        closed_balances = self.closed_position_balances.get(ctx.address, {})
        closed_balances[self.token_b] = Amount(available_token_b - action_token_b.amount)

        # Check HTR withdrawal if requested
        if action_htr:
            available_htr = self.closed_position_balances.get(ctx.address, {}).get(
                TokenUid(HTR_UID), Amount(0)
            )
            if action_htr.amount > available_htr:
                raise NCFail(
                    f"Not enough HTR balance. Available: {available_htr}, Requested: {action_htr.amount}"
                )
            
            closed_balances[TokenUid(HTR_UID)] = Amount(available_htr - action_htr.amount)

        # Update closed position balances
        self.closed_position_balances[ctx.address] = closed_balances

        # If all funds withdrawn, clean up user data
        if (
            closed_balances.get(self.token_b, 0) == 0
            and closed_balances.get(TokenUid(HTR_UID), 0) == 0
        ):
            self.user_deposit_b.__delitem__(ctx.address)
            self.user_withdrawal_time.__delitem__(ctx.address)
            self.htr_price_in_deposit.__delitem__(ctx.address)
            self.token_price_in_htr_in_deposit.__delitem__(ctx.address)
            self.user_position_closed.__delitem__(ctx.address)

    @public(allow_withdrawal=True)
    def user_withdraw_bonus(self, ctx: Context) -> None:
        action = self._get_action(ctx, NCActionType.WITHDRAWAL, auth=False)
        if action.token_uid != HTR_UID:
            raise NCFail("Withdrawal token not HATHOR")
        if action.amount > self.user_balances.get(ctx.address, {HTR_UID: 0}).get(
            HTR_UID, 0
        ):
            raise NCFail("Withdrawal amount too high")
        partial = self.user_balances.get(ctx.address, {})
        partial[TokenUid(HTR_UID)] = Amount(partial.get(TokenUid(HTR_UID), 0) - action.amount)
        self.user_balances[ctx.address] = partial

    @public
    def update_protocol_fee(self, ctx: Context, new_fee: Amount) -> None:
        """Update the protocol fee percentage (in thousandths).

        Args:
            ctx: Execution context
            new_fee: New fee value in thousandths (e.g. 500 = 0.5%)

        Raises:
            NCFail: If caller is not dev or fee exceeds maximum
        """
        if ctx.address != self.dev_address:
            raise NCFail("Only dev can update protocol fee")
        if new_fee > 1000 or new_fee < 0:
            raise NCFail("Protocol fee cannot exceed 100%")

        self.protocol_fee = new_fee

    def _get_oasis_lp_amount_b(self) -> Amount:
        # Get user info for this contract from the pool manager
        pool_key = self._get_pool_key()
        user_info = self.syscall.call_view_method(
            self.dozer_pool_manager,
            "user_info",
            self.syscall.get_contract_id(),
            pool_key
        )
        return user_info.token1Amount  # token_b amount

    def _quote_add_liquidity_in(self, amount: Amount) -> Amount:
        pool_key = self._get_pool_key()
        return self.syscall.call_view_method(
            self.dozer_pool_manager, "front_quote_add_liquidity_in", amount, self.token_b, pool_key
        )

    def _quote_remove_liquidity_oasis(self) -> dict[str, int]:
        # Get user info for this contract from the pool manager
        pool_key = self._get_pool_key()
        user_info = self.syscall.call_view_method(
            self.dozer_pool_manager,
            "user_info",
            self.syscall.get_contract_id(),
            pool_key
        )
        return {
            "max_withdraw_a": user_info.token0Amount,  # HTR amount
            "user_lp_b": user_info.token1Amount,      # token_b amount
        }

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

    @public(allow_withdrawal=True)
    def owner_withdraw(self, ctx: Context) -> None:
        """Allows owner to withdraw HTR from their balance.

        Args:
            ctx: Execution context

        Raises:
            NCFail: If caller is not owner or withdraw amount exceeds available balance
        """
        if ctx.address != self.owner_address:
            raise NCFail("Only owner can withdraw")
        action = self._get_token_action(
            ctx, NCActionType.WITHDRAWAL, HTR_UID, auth=False
        )
        if action.amount > self.oasis_htr_balance:
            raise NCFail("Withdrawal amount too high")
        self.oasis_htr_balance = Amount(self.oasis_htr_balance - action.amount)

    @public(allow_withdrawal=True)
    def dev_withdraw_fee(self, ctx: Context) -> None:
        """Allows dev to withdraw collected protocol fees.

        Args:
            ctx: Execution context

        Raises:
            NCFail: If caller is not dev or withdraw amount exceeds available balance
        """
        if ctx.address != self.dev_address:
            raise NCFail("Only dev can withdraw fees")

        token_b_action = self._get_token_action(
            ctx, NCActionType.WITHDRAWAL, self.token_b
        )
        if token_b_action.amount > self.user_balances.get(self.dev_address, {}).get(
            self.token_b, 0
        ):
            raise NCFail("Withdrawal amount too high")

        partial = self.user_balances.get(self.dev_address, {})
        partial[self.token_b] = Amount(partial.get(self.token_b, 0) - token_b_action.amount)
        self.user_balances[self.dev_address] = partial

    @public
    def update_owner_address(self, ctx: Context, new_owner: bytes) -> None:
        """Updates the owner address. Can be called by dev or current owner.

        Args:
            ctx: Execution context
            new_owner: New owner address

        Raises:
            NCFail: If caller is not dev or current owner
        """
        if ctx.address not in [self.dev_address, self.owner_address]:
            raise NCFail("Only dev or owner can update owner address")
        self.owner_address = new_owner

    def _get_action(
        self, ctx: Context, action_type: NCActionType, auth: bool
    ) -> NCDepositAction | NCWithdrawalAction:
        """Returns one action tested by type and index"""
        if len(ctx.actions) != 1:
            raise NCFail
        output = ctx.get_single_action(TokenUid(HTR_UID))
        if not output:
            raise NCFail
        if output.type != action_type:
            raise NCFail
        if auth:
            if ctx.address != self.dev_address:
                raise NCFail
        if isinstance(output, NCDepositAction):
            return NCDepositAction(amount=output.amount, token_uid=output.token_uid)
        elif isinstance(output, NCWithdrawalAction):
            return NCWithdrawalAction(amount=output.amount, token_uid=output.token_uid)
        else:
            raise NCFail

    def _get_token_action(
        self,
        ctx: Context,
        action_type: NCActionType,
        token: TokenUid,
        auth: bool = False,
    ) -> NCDepositAction | NCWithdrawalAction:
        """Returns one action tested by type and index"""
        if len(ctx.actions) > 2:
            raise NCFail
        output = ctx.get_single_action(token)

        if not output:
            raise NCFail
        if output.type != action_type:
            raise NCFail
        if auth:
            if ctx.address != self.dev_address:
                raise NCFail
        if isinstance(output, NCDepositAction):
            return NCDepositAction(amount=output.amount, token_uid=output.token_uid)
        elif isinstance(output, NCWithdrawalAction):
            return NCWithdrawalAction(amount=output.amount, token_uid=output.token_uid)
        else:
            raise NCFail

    @view
    def user_info(
        self,
        address: Address,
    ) -> OasisUserInfo:
        remove_liquidity_oasis_quote = self.get_remove_liquidity_oasis_quote(address)
        return OasisUserInfo(
            user_deposit_b=Amount(self.user_deposit_b.get(address, 0)),
            user_liquidity=Amount(self.user_liquidity.get(address, 0)),
            user_withdrawal_time=self.user_withdrawal_time.get(address, 0),
            oasis_htr_balance=self.oasis_htr_balance,
            total_liquidity=self.total_liquidity,
            user_balance_a=Amount(self.user_balances.get(address, {HTR_UID: 0}).get(
                HTR_UID, 0
            )),
            user_balance_b=Amount(self.user_balances.get(address, {self.token_b: 0}).get(
                self.token_b, 0
            )),
            closed_balance_a=Amount(self.closed_position_balances.get(
                address, {HTR_UID: 0}
            ).get(HTR_UID, 0)),
            closed_balance_b=Amount(self.closed_position_balances.get(
                address, {self.token_b: 0}
            ).get(self.token_b, 0)),
            user_lp_b=Amount(remove_liquidity_oasis_quote.user_lp_b),
            user_lp_htr=Amount(remove_liquidity_oasis_quote.user_lp_htr),
            max_withdraw_b=Amount(remove_liquidity_oasis_quote.max_withdraw_b),
            max_withdraw_htr=Amount(remove_liquidity_oasis_quote.max_withdraw_htr),
            htr_price_in_deposit=Amount(self.htr_price_in_deposit.get(address, 0)),
            token_price_in_htr_in_deposit=Amount(self.token_price_in_htr_in_deposit.get(
                address, 0
            )),
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

        if address in self.user_withdrawal_time:
            delta = self.user_withdrawal_time[address] - now
            if delta > 0:
                withdrawal_time = int(
                    now
                    + (
                        (
                            (delta * self.user_deposit_b[address])
                            + (deposit_amount * timelock * MONTHS_IN_SECONDS)
                        )
                        // (self.user_deposit_b[address] + deposit_amount)
                    )
                    + 1
                )
            else:
                withdrawal_time = int(now + timelock * MONTHS_IN_SECONDS)
        else:
            withdrawal_time = int(now + timelock * MONTHS_IN_SECONDS)

        return OasisQuoteInfo(
            bonus=bonus,
            htr_amount=htr_amount,
            withdrawal_time=withdrawal_time,
            has_position=address in self.user_withdrawal_time,
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
                    HTR_UID, 0
                )),
                loss_htr=Amount(0),
                position_closed=True,
            )

        # Otherwise calculate withdrawal amounts based on current pool state
        oasis_quote = self._quote_remove_liquidity_oasis()
        htr_oasis_amount = oasis_quote["max_withdraw_a"]
        token_b_oasis_amount = oasis_quote["user_lp_b"]
        user_liquidity = self.user_liquidity.get(address, 0)

        if self.total_liquidity > 0:
            user_lp_b = (
                (user_liquidity) * token_b_oasis_amount // (self.total_liquidity)
            )
            user_lp_htr = (user_liquidity) * htr_oasis_amount // (self.total_liquidity)
        else:
            user_lp_b = 0
            user_lp_htr = 0

        # Calculate total available amounts including existing balances
        user_balance_b = self.user_balances.get(address, {}).get(self.token_b, 0)
        user_balance_htr = self.user_balances.get(address, {}).get(HTR_UID, 0)
        max_withdraw_b = user_lp_b + user_balance_b

        # Calculate impermanent loss compensation if needed
        loss_htr = 0
        if self.user_deposit_b.get(address, 0) > max_withdraw_b:
            loss = self.user_deposit_b.get(address, 0) - max_withdraw_b
            # Get pool reserves to calculate quote
            reserves = self.syscall.call_view_method(self.dozer_pool_manager, "get_reserves", HTR_UID, self.token_b, self.pool_fee)
            loss_htr = self.syscall.call_view_method(self.dozer_pool_manager, "quote", loss, reserves[1], reserves[0])
            if loss_htr > user_lp_htr:
                loss_htr = user_lp_htr
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

__blueprint__ = Oasis