from typing import NamedTuple

from hathor import (
    Context,
    BlueprintId,
    Blueprint,
    BlueprintId,
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

@export
class Oasis(Blueprint):
    """Oasis contract that interacts with Dozer Pool Manager contract."""

    # Version control
    contract_version: str

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
        self.contract_version = "1.0.0"
        action = self._get_action(ctx, NCActionType.DEPOSIT, auth=False)
        if action.amount < MIN_DEPOSIT or action.token_uid != HTR_UID:
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
        self.protocol_fee = protocol_fee
        self.owner_address = Address(ctx.caller_id)

        # Initialize all dict fields
        self.user_deposit_b: dict[bytes, Amount]= {}
        self.htr_price_in_deposit: dict[bytes, Amount] = {}
        self.token_price_in_htr_in_deposit: dict[bytes, Amount] = {}
        self.user_liquidity: dict[bytes, Amount] = {}
        self.user_withdrawal_time: dict[bytes, int] = {}
        self.user_balances:dict[bytes, dict[TokenUid, Amount]] = {}
        self.user_position_closed: dict[bytes, bool] = {}
        self.closed_position_balances: dict[bytes, dict[TokenUid, Amount]] = {}

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
        if Address(ctx.caller_id) not in [self.dev_address, self.owner_address]:
            raise NCFail("Only dev or owner can deposit")
        if action.token_uid != HTR_UID:
            raise NCFail("Deposit token not HATHOR")
        self.oasis_htr_balance = Amount(self.oasis_htr_balance + action.amount)
        self.dev_deposit_amount = Amount(self.dev_deposit_amount + action.amount)

    @public(allow_deposit=True)
    def user_deposit(self, ctx: Context, timelock: int) -> None:
        """Deposits token B with a timelock period for bonus rewards.

        Args:
            ctx: Execution context
            timelock: Lock period in months (6, 9, or 12)

        Raises:
            NCFail: If deposit requirements not met or invalid timelock
        """
        action = self._get_token_action(
            ctx, NCActionType.DEPOSIT, self.token_b, auth=False
        )
        if action.token_uid != self.token_b:
            raise NCFail("Deposit token not B")

        if self.user_position_closed.get(Address(ctx.caller_id), False):
            raise NCFail("Need to close position before deposit")

        # Get HTR price in USD from the DozerPoolManager
        htr_price = self.syscall.get_contract(
            self.dozer_pool_manager, blueprint_id=None
        ).view().get_token_price_in_usd(HTR_UID)
        if htr_price == 0:
            raise NCFail("HTR price not available from pool manager")

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
        now = ctx.block.timestamp
        if htr_amount + bonus > self.oasis_htr_balance:
            raise NCFail("Not enough balance")

        if self.total_liquidity == 0:
            self.total_liquidity = Amount(deposit_amount * PRECISION)
            self.user_liquidity[Address(ctx.caller_id)] = Amount(deposit_amount * PRECISION)
        else:
            liquidity_increase = (
                self.total_liquidity
                * deposit_amount
                // self._get_oasis_lp_amount_b()
            )
            self.user_liquidity[Address(ctx.caller_id)] = Amount(
                self.user_liquidity.get(Address(ctx.caller_id), 0) + liquidity_increase
            )
            self.total_liquidity = Amount(self.total_liquidity + liquidity_increase)

        if Address(ctx.caller_id) in self.user_withdrawal_time:
            delta = self.user_withdrawal_time[Address(ctx.caller_id)] - now
            if delta > 0:
                self.user_withdrawal_time[Address(ctx.caller_id)] = int(
                    now
                    + (
                        (
                            (delta * self.user_deposit_b[Address(ctx.caller_id)])
                            + (deposit_amount * timelock * MONTHS_IN_SECONDS)
                        )
                        // (deposit_amount + self.user_deposit_b[Address(ctx.caller_id)])
                    )
                    + 1
                )
            else:
                self.user_withdrawal_time[Address(ctx.caller_id)] = (
                    int(now + int(timelock * int(MONTHS_IN_SECONDS)))
                )
            # updating position initial price with weighted average
            self.htr_price_in_deposit[Address(ctx.caller_id)] = Amount(
                (
                    self.htr_price_in_deposit[Address(ctx.caller_id)]
                    * self.user_deposit_b[Address(ctx.caller_id)]
                    + htr_price * deposit_amount
                )
                // (self.user_deposit_b[Address(ctx.caller_id)] + deposit_amount)
            )
            self.token_price_in_htr_in_deposit[Address(ctx.caller_id)] = Amount(
                (
                    self.token_price_in_htr_in_deposit[Address(ctx.caller_id)]
                    * self.user_deposit_b[Address(ctx.caller_id)]
                    + token_price_in_htr * deposit_amount
                )
                // (self.user_deposit_b[Address(ctx.caller_id)] + deposit_amount)
            )

        else:
            self.htr_price_in_deposit[Address(ctx.caller_id)] = htr_price
            self.token_price_in_htr_in_deposit[Address(ctx.caller_id)] = Amount(token_price_in_htr)
            self.user_withdrawal_time[Address(ctx.caller_id)] = int(now + timelock * MONTHS_IN_SECONDS)

        self.oasis_htr_balance = Amount(self.oasis_htr_balance - bonus - htr_amount)
        partial = self.user_balances.get(Address(ctx.caller_id), {})
        partial[TokenUid(HTR_UID)] = Amount(partial.get(TokenUid(HTR_UID), 0) + bonus)

        self.user_balances[Address(ctx.caller_id)] = partial
        self.user_deposit_b[Address(ctx.caller_id)] = Amount(
            self.user_deposit_b.get(Address(ctx.caller_id), 0) + deposit_amount
        )

        actions:list[NCAction] = [
            NCDepositAction(amount=deposit_amount, token_uid=self.token_b),
            NCDepositAction(amount=htr_amount, token_uid=TokenUid(HTR_UID))
        ]

        result = self.syscall.get_contract(
            self.dozer_pool_manager, blueprint_id=None
        ).public(*actions).add_liquidity(self.pool_fee)

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
            self.syscall.get_contract(
                self.dozer_pool_manager, blueprint_id=None
            ).public(*adjust_actions).withdraw_cashback(self.pool_fee)
            partial = self.user_balances.get(Address(ctx.caller_id), {})
            partial.update(
                {
                    result[0]: partial.get(result[0], 0) + result[1],
                }
            )
            self.user_balances[Address(ctx.caller_id)] = partial

    @public(allow_withdrawal=True)
    def close_position(self, ctx: Context) -> None:
        """Close a user's position, removing liquidity from the pool and making funds available for withdrawal.

        Args:
            ctx: Execution context

        Raises:
            NCFail: If position is still locked or already closed
        """
        # Verify position can be closed
        if ctx.block.timestamp < self.user_withdrawal_time.get(Address(ctx.caller_id), 0):
            raise NCFail("Position is still locked")

        if self.user_position_closed.get(Address(ctx.caller_id), False):
            raise NCFail("Position already closed")

        if self.user_liquidity.get(Address(ctx.caller_id), 0) == 0:
            raise NCFail("No position to close")

        # Get quote information
        oasis_quote = self._quote_remove_liquidity_oasis()
        htr_oasis_amount = oasis_quote["max_withdraw_a"]
        token_b_oasis_amount = oasis_quote["user_lp_b"]
        user_liquidity = self.user_liquidity.get(Address(ctx.caller_id), 0)
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
        user_token_b_balance = self.user_balances.get(Address(ctx.caller_id), {}).get(
            self.token_b, 0
        )
        max_withdraw_b = user_lp_b + user_token_b_balance

        # Check for impermanent loss
        if self.user_deposit_b.get(Address(ctx.caller_id), 0) > max_withdraw_b:
            loss = self.user_deposit_b[Address(ctx.caller_id)] - max_withdraw_b
            # Get pool reserves to calculate quote
            reserves = self.syscall.get_contract(
                self.dozer_pool_manager, blueprint_id=None
            ).view().get_reserves(HTR_UID, self.token_b, self.pool_fee)
            loss_htr = self.syscall.get_contract(
                self.dozer_pool_manager, blueprint_id=None
            ).view().quote(loss, reserves[1], reserves[0])
            if loss_htr > user_lp_htr:
                loss_htr = user_lp_htr

        # Call dozer pool manager to remove liquidity
        self.syscall.get_contract(
            self.dozer_pool_manager, blueprint_id=None
        ).public(*actions).remove_liquidity(self.pool_fee)

        # Get existing cashback balances
        user_current_balance = self.user_balances.get(Address(ctx.caller_id), {})
        user_htr_current_balance = Amount(user_current_balance.get(TokenUid(HTR_UID), 0))

        # First, return the user_lp_htr back to oasis_htr_balance
        self.oasis_htr_balance = Amount(self.oasis_htr_balance + user_lp_htr - loss_htr)

        # Then update closed balances without adding user_lp_htr again
        closed_balances = self.closed_position_balances.get(Address(ctx.caller_id), {})
        closed_balances[self.token_b] = Amount(closed_balances.get(self.token_b, 0) + user_token_b_balance + user_lp_b)
        closed_balances[TokenUid(HTR_UID)] = Amount(closed_balances.get(TokenUid(HTR_UID), 0) + user_htr_current_balance + loss_htr)
        self.closed_position_balances[Address(ctx.caller_id)] = closed_balances

        # Clear user cashback balances after moving them
        if user_token_b_balance > 0 or user_htr_current_balance > 0:
            user_balance = self.user_balances.get(Address(ctx.caller_id), {})
            user_balance[TokenUid(HTR_UID)] = Amount(0)
            user_balance[self.token_b] = Amount(0)
            self.user_balances[Address(ctx.caller_id)] = user_balance

        # Mark position as closed
        self.user_position_closed[Address(ctx.caller_id)] = True

        # Keep the deposit amounts for reference, but reset liquidity
        self.total_liquidity = Amount(self.total_liquidity - self.user_liquidity[Address(ctx.caller_id)])
        del self.user_liquidity[Address(ctx.caller_id)]
        del self.user_withdrawal_time[Address(ctx.caller_id)]

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
        if ctx.block.timestamp < self.user_withdrawal_time.get(Address(ctx.caller_id), 0):
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
                TokenUid(HTR_UID), Amount(0)
            )
            if action_htr.amount > available_htr:
                raise NCFail(
                    f"Not enough HTR balance. Available: {available_htr}, Requested: {action_htr.amount}"
                )

            closed_balances[TokenUid(HTR_UID)] = Amount(available_htr - action_htr.amount)

        # Update closed position balances
        self.closed_position_balances[Address(ctx.caller_id)] = closed_balances

        # If all funds withdrawn, clean up user data
        if (
            closed_balances.get(self.token_b, 0) == 0
            and closed_balances.get(TokenUid(HTR_UID), 0) == 0
        ):
            del self.user_deposit_b[Address(ctx.caller_id)]
            del self.user_withdrawal_time[Address(ctx.caller_id)]
            del self.htr_price_in_deposit[Address(ctx.caller_id)]
            del self.token_price_in_htr_in_deposit[Address(ctx.caller_id)]
            del self.user_position_closed[Address(ctx.caller_id)]

    @public(allow_withdrawal=True)
    def user_withdraw_bonus(self, ctx: Context) -> None:
        action = self._get_action(ctx, NCActionType.WITHDRAWAL, auth=False)
        if action.token_uid != HTR_UID:
            raise NCFail("Withdrawal token not HATHOR")
        if action.amount > self.user_balances.get(Address(ctx.caller_id), {HTR_UID: 0}).get(
            HTR_UID, 0
        ):
            raise NCFail("Withdrawal amount too high")
        partial = self.user_balances.get(Address(ctx.caller_id), {})
        partial[TokenUid(HTR_UID)] = Amount(partial.get(TokenUid(HTR_UID), 0) - action.amount)
        self.user_balances[Address(ctx.caller_id)] = partial

    @public
    def update_protocol_fee(self, ctx: Context, new_fee: Amount) -> None:
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
            raise NCFail("Protocol fee cannot exceed 100%")

        self.protocol_fee = new_fee

    def _get_oasis_lp_amount_b(self) -> Amount:
        # Get user info for this contract from the pool manager
        pool_key = self._get_pool_key()
        user_info = self.syscall.get_contract(
            self.dozer_pool_manager, blueprint_id=None
        ).view().user_info(
            self.syscall.get_contract_id(),
            pool_key
        )
        return user_info.token1Amount  # token_b amount

    def _quote_add_liquidity_in(self, amount: Amount) -> Amount:
        pool_key = self._get_pool_key()
        return self.syscall.get_contract(
            self.dozer_pool_manager, blueprint_id=None
        ).view().front_quote_add_liquidity_in(amount, self.token_b, pool_key)

    def _quote_remove_liquidity_oasis(self) -> dict[str, int]:
        # Get user info for this contract from the pool manager
        pool_key = self._get_pool_key()
        user_info = self.syscall.get_contract(
            self.dozer_pool_manager, blueprint_id=None
        ).view().user_info(
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
        if Address(ctx.caller_id) != self.owner_address:
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
        if Address(ctx.caller_id) != self.dev_address:
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
        if Address(ctx.caller_id) not in [self.dev_address, self.owner_address]:
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
            if Address(ctx.caller_id) != self.dev_address:
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
            if Address(ctx.caller_id) != self.dev_address:
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

        # Safely access nested dicts using 'in' check to avoid state changes
        user_balance_a = 0
        if address in self.user_balances:
            user_balance_a = self.user_balances[address].get(HTR_UID, 0)

        user_balance_b = 0
        if address in self.user_balances:
            user_balance_b = self.user_balances[address].get(self.token_b, 0)

        closed_balance_a = 0
        if address in self.closed_position_balances:
            closed_balance_a = self.closed_position_balances[address].get(HTR_UID, 0)

        closed_balance_b = 0
        if address in self.closed_position_balances:
            closed_balance_b = self.closed_position_balances[address].get(self.token_b, 0)

        return OasisUserInfo(
            user_deposit_b=Amount(self.user_deposit_b.get(address, 0)),
            user_liquidity=Amount(self.user_liquidity.get(address, 0)),
            user_withdrawal_time=self.user_withdrawal_time.get(address, 0),
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
            reserves = self.syscall.get_contract(
                self.dozer_pool_manager, blueprint_id=None
            ).view().get_reserves(HTR_UID, self.token_b, self.pool_fee)
            loss_htr = self.syscall.get_contract(
                self.dozer_pool_manager, blueprint_id=None
            ).view().quote(loss, reserves[1], reserves[0])
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

        # Perform the upgrade
        contract_id = self.syscall.get_contract_id()
        self.syscall.change_blueprint(new_blueprint_id)

        # Call post-upgrade initialization on the new blueprint (optional)
        # The new blueprint can implement this method to handle migrations
        # self.syscall.get_contract(contract_id, blueprint_id=None).public().post_upgrade_init(new_version)

    def _is_version_higher(self, new_version: str, current_version: str) -> bool:
        """Compare semantic versions (e.g., "1.2.3").

        Returns True if new_version > current_version.
        Returns False if versions are malformed or equal.
        """
        # Split versions by '.'
        new_parts_str = new_version.split('.')
        current_parts_str = current_version.split('.')
        
        # Check if all parts are valid integers
        new_parts: list[int] = []
        for part in new_parts_str:
            # Simple check: all characters must be digits
            if not part or not all(c in '0123456789' for c in part):
                return False  # Invalid format
            new_parts.append(int(part))
        
        current_parts: list[int] = []
        for part in current_parts_str:
            if not part or not all(c in '0123456789' for c in part):
                return False  # Invalid format
            current_parts.append(int(part))

        # Pad shorter version with zeros
        max_len = len(new_parts) if len(new_parts) > len(current_parts) else len(current_parts)
        while len(new_parts) < max_len:
            new_parts.append(0)
        while len(current_parts) < max_len:
            current_parts.append(0)

        # Compare versions
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
