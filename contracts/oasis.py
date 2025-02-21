from typing import Optional
from hathor.conf.get_settings import HathorSettings
from hathor.nanocontracts.context import Context
from hathor.types import Address, Amount, Timestamp, TokenUid
from hathor.nanocontracts.blueprint import Blueprint
from hathor.nanocontracts.exception import NCFail
from hathor.nanocontracts.types import (
    ContractId,
    NCAction,
    NCActionType,
    public,
    view,
)
from hathor.wallet.resources import balance

MIN_DEPOSIT = 10000_00
PRECISION = 10**20
MONTHS_IN_SECONDS = 60
HTR_UID = HathorSettings().HATHOR_TOKEN_UID  # type: ignore


class Oasis(Blueprint):
    """Oasis contract that interacts with Dozer Pool contract."""

    dozer_pool: ContractId
    protocol_fee: Amount

    dev_address: Address
    dev_balance: Amount
    user_deposit_b: dict[Address, Amount]
    user_liquidity: dict[Address, Amount]
    total_liquidity: Amount
    user_withdrawal_time: dict[Address, Timestamp]
    user_balances: dict[Address, dict[TokenUid, Amount]]
    token_b: TokenUid

    @public
    def initialize(
        self,
        ctx: Context,
        dozer_pool: ContractId,
        token_b: TokenUid,
        protocol_fee: Amount,
    ) -> None:
        """Initialize the contract with no dozer pool set."""
        pool_token_a, pool_token_b = self.call_view_method(dozer_pool, "get_uuids")
        if pool_token_a != HTR_UID or pool_token_b != token_b:
            raise (NCFail)
        action = self._get_action(ctx, NCActionType.DEPOSIT, auth=False)
        if action.amount < MIN_DEPOSIT or action.token_uid != HTR_UID:
            raise NCFail("Deposit amount too low or token not HATHOR")
        if protocol_fee < 0 or protocol_fee > 1000:
            raise NCFail("Protocol fee must be between 0 and 1000")
        self.token_b = token_b
        self.dev_address = ctx.address
        self.dozer_pool = dozer_pool
        self.dev_balance = action.amount
        self.total_liquidity = 0
        self.protocol_fee = protocol_fee

    @public
    def dev_deposit(self, ctx: Context) -> None:
        """Deposits token B with a timelock period for bonus rewards.

        Args:
            ctx: Execution context
            timelock: Lock period in months (6, 9, or 12)

        Raises:
            NCFail: If deposit requirements not met or invalid timelock
        """
        action = self._get_action(ctx, NCActionType.DEPOSIT, auth=False)
        if action.token_uid != HTR_UID:
            raise NCFail("Deposit token not HATHOR")
        self.dev_balance += action.amount

    @public
    def user_deposit(self, ctx: Context, timelock: int) -> None:
        action = self._get_token_action(
            ctx, NCActionType.DEPOSIT, self.token_b, auth=False
        )
        if action.token_uid != self.token_b:
            raise NCFail("Deposit token not B")

        # Calculate and deduct protocol fee
        amount = action.amount
        fee_amount = (amount * self.protocol_fee) // 1000
        deposit_amount = amount - fee_amount

        # Add fee to dev balances
        partial = self.user_balances.get(self.dev_address, {})
        partial.update(
            {
                self.token_b: partial.get(self.token_b, 0) + fee_amount,
            }
        )
        self.user_balances[self.dev_address] = partial

        # Continue with deposit using reduced amount
        htr_amount = self._quote_add_liquidity_in(deposit_amount)
        bonus = self._get_user_bonus(timelock, htr_amount)
        now = ctx.timestamp
        if htr_amount + bonus > self.dev_balance:
            raise NCFail("Not enough balance")

        if self.total_liquidity == 0:
            self.total_liquidity = deposit_amount * PRECISION
            self.user_liquidity[ctx.address] = deposit_amount * PRECISION
        else:
            liquidity_increase = (
                self.total_liquidity
                * deposit_amount
                // self._get_oasis_lp_amount_b(ctx)
            )
            self.user_liquidity[ctx.address] = (
                self.user_liquidity.get(ctx.address, 0) + liquidity_increase
            )
            self.total_liquidity += liquidity_increase

        if ctx.address in self.user_withdrawal_time:
            delta = self.user_withdrawal_time[ctx.address] - now
            if delta > 0:
                self.user_withdrawal_time[ctx.address] = (
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
                    now + timelock * MONTHS_IN_SECONDS
                )
        else:
            self.user_withdrawal_time[ctx.address] = now + timelock * MONTHS_IN_SECONDS

        self.dev_balance -= bonus + htr_amount
        partial = self.user_balances.get(ctx.address, {})
        partial.update(
            {
                HTR_UID: partial.get(HTR_UID, 0) + bonus,
            }
        )
        self.user_balances[ctx.address] = partial
        self.user_deposit_b[ctx.address] = (
            self.user_deposit_b.get(ctx.address, 0) + deposit_amount
        )

        actions = [
            NCAction(NCActionType.DEPOSIT, self.token_b, deposit_amount),
            NCAction(NCActionType.DEPOSIT, HTR_UID, htr_amount),
        ]
        result = self.call_public_method(self.dozer_pool, "add_liquidity", actions)
        if result[1] > 0:
            if result[0] == self.token_b:
                adjust_actions = [
                    NCAction(NCActionType.WITHDRAWAL, HTR_UID, 0),
                    NCAction(NCActionType.WITHDRAWAL, self.token_b, result[1]),
                ]
            else:
                adjust_actions = [
                    NCAction(NCActionType.WITHDRAWAL, HTR_UID, result[1]),
                    NCAction(NCActionType.WITHDRAWAL, self.token_b, 0),
                ]
            self.call_public_method(
                self.dozer_pool, "withdraw_cashback", adjust_actions
            )
            partial = self.user_balances.get(ctx.address, {})
            partial.update(
                {
                    result[0]: partial.get(result[0], 0) + result[1],
                }
            )
            self.user_balances[ctx.address] = partial

    @public
    def user_withdraw(self, ctx: Context) -> None:
        action_token_b = self._get_token_action(
            ctx, NCActionType.WITHDRAWAL, self.token_b
        )
        action_htr = None
        if len(ctx.actions) > 1:
            action_htr = self._get_token_action(ctx, NCActionType.WITHDRAWAL, HTR_UID)
        if ctx.timestamp < self.user_withdrawal_time[ctx.address]:
            raise NCFail("Withdrawal locked")
        oasis_quote = self._quote_remove_liquidity_oasis()
        htr_oasis_amount = oasis_quote["max_withdraw_a"]
        token_b_oasis_amount = oasis_quote["user_lp_b"]
        user_liquidity = self.user_liquidity.get(ctx.address, 0)
        user_lp_b = (user_liquidity) * token_b_oasis_amount // (self.total_liquidity)
        user_lp_htr = user_liquidity * htr_oasis_amount // (self.total_liquidity)
        actions = [
            NCAction(NCActionType.WITHDRAWAL, HTR_UID, user_lp_htr),
            NCAction(NCActionType.WITHDRAWAL, self.token_b, user_lp_b),
        ]
        # ctx.call_public_method(self.dozer_pool, "remove_liquidity", actions)
        max_withdraw_b = user_lp_b + self.user_balances[ctx.address].get(
            self.token_b, 0
        )

        ## token_b handling
        if action_token_b.amount > max_withdraw_b:
            raise NCFail(
                f"Not enough balance. max_withdraw_b: {max_withdraw_b}, action_token_b.amount: {action_token_b.amount}"
            )
        else:
            partial = self.user_balances.get(ctx.address, {})
            partial.update(
                {
                    self.token_b: max_withdraw_b - action_token_b.amount,
                }
            )
            self.user_balances[ctx.address] = partial

        ## htr handling
        loss_htr = 0
        # impermanent loss
        if self.user_deposit_b[ctx.address] > max_withdraw_b:
            loss = self.user_deposit_b[ctx.address] - max_withdraw_b
            loss_htr = self.call_view_method(self.dozer_pool, "quote_token_b", loss)
            if loss_htr > user_lp_htr:
                loss_htr = user_lp_htr
            max_withdraw_htr = (
                self.user_balances[ctx.address].get(HTR_UID, 0) + loss_htr
            )
        # without impermanent loss
        else:
            max_withdraw_htr = self.user_balances[ctx.address].get(HTR_UID, 0)

        if action_htr and action_htr.amount > max_withdraw_htr:
            raise NCFail(f"Not enough balance {max_withdraw_htr=} {action_htr.amount=}")
        partial = self.user_balances.get(ctx.address, {})
        if action_htr:
            partial.update(
                {
                    HTR_UID: max_withdraw_htr - action_htr.amount,
                }
            )
        self.call_public_method(self.dozer_pool, "remove_liquidity", actions)
        self.dev_balance = self.dev_balance + user_lp_htr - loss_htr
        self.user_balances[ctx.address] = partial
        self.user_liquidity[ctx.address] = 0
        self.user_deposit_b[ctx.address] = 0
        self.user_withdrawal_time[ctx.address] = 0

    @public
    def user_withdraw_bonus(self, ctx: Context) -> None:
        action = self._get_action(ctx, NCActionType.WITHDRAWAL, auth=False)
        if action.token_uid != HTR_UID:
            raise NCFail("Withdrawal token not HATHOR")
        if action.amount > self.user_balances.get(ctx.address, {HTR_UID: 0}).get(
            HTR_UID, 0
        ):
            raise NCFail("Withdrawal amount too high")
        partial = self.user_balances.get(ctx.address, {})
        partial.update(
            {
                HTR_UID: partial.get(HTR_UID, 0) - action.amount,
            }
        )
        self.user_balances[ctx.address] = partial

    @public
    def update_protocol_fee(self, ctx: Context, new_fee: Amount) -> None:
        """Update the protocol fee percentage (in thousandths).

        Args:
            ctx: Execution context
            new_fee: New fee value in thousandths (e.g. 500 = 0.5%)

        Raises:
            NCFail: If caller is not admin or fee exceeds maximum
        """
        if ctx.address != self.dev_address:
            raise NCFail("Only admin can update protocol fee")
        if new_fee > 1000 or new_fee < 0:
            raise NCFail("Protocol fee cannot exceed 100%")

        self.protocol_fee = new_fee

    def _get_oasis_lp_amount_b(self, ctx: Context) -> Amount:
        return self.call_view_method(
            self.dozer_pool,
            "max_withdraw_b",
            self.get_nanocontract_id(),
        )

    def _quote_add_liquidity_in(self, amount: Amount) -> Amount:
        return self.call_view_method(
            self.dozer_pool, "front_quote_add_liquidity_in", amount, self.token_b
        )

    def _quote_remove_liquidity_oasis(self) -> dict[str, int]:
        return self.call_view_method(
            self.dozer_pool, "quote_remove_liquidity", self.get_nanocontract_id()
        )

    def _get_user_bonus(self, timelock: int, amount: Amount) -> Amount:
        """Calculates the bonus for a user based on the timelock and amount"""
        if timelock not in [6, 9, 12]:  # Assuming these are the only valid values
            raise NCFail("Invalid timelock value")
        bonus_multiplier = {6: 0.1, 9: 0.15, 12: 0.2}

        return int(bonus_multiplier[timelock] * amount)

    def _get_action(
        self, ctx: Context, action_type: NCActionType, auth: bool
    ) -> NCAction:
        """Returns one action tested by type and index"""
        if len(ctx.actions) != 1:
            raise NCFail
        # if ctx.actions.keys not in rewardable_indexs:
        #     raise InvalidTokens()
        keys = ctx.actions.keys()
        output = ctx.actions.get(HTR_UID)
        if not output:
            raise NCFail
        if output.type != action_type:
            raise NCFail
        if auth:
            if ctx.address != self.dev_address:
                raise NCFail

        return output

    def _get_token_action(
        self,
        ctx: Context,
        action_type: NCActionType,
        token: TokenUid,
        auth: bool = False,
    ) -> NCAction:
        """Returns one action tested by type and index"""
        if len(ctx.actions) > 2:
            raise NCFail
        try:
            output = ctx.actions.get(token)
        except:
            raise NCFail

        if not output:
            raise NCFail

        if output.type != action_type:
            raise NCFail
        if auth:
            if ctx.address != self.dev_address:
                raise NCFail

        return output

    @public
    def check_pool_liquidity(self, ctx: Context, token_uid: bytes, amount: int) -> dict:
        """Check liquidity for adding tokens to the pool.

        Args:
            ctx: The execution context
            token_uid: The token to check liquidity for
            amount: The amount to check

        Returns:
            The liquidity quote from the pool

        Raises:
            NCFail: If dozer pool is not set
        """
        if self.dozer_pool is None:
            raise NCFail("Dozer pool contract not set")

        # Call the private method on the dozer pool contract
        return self.call_view_method(
            self.dozer_pool, "front_quote_add_liquidity_in", amount, token_uid
        )

    @view
    def user_info(
        self,
        address: Address,
    ) -> dict[str, float]:
        remove_liquidity_oasis_quote = self.get_remove_liquidity_oasis_quote(address)
        return {
            "user_deposit_b": self.user_deposit_b.get(address, 0),
            "user_liquidity": self.user_liquidity.get(address, 0),
            "user_withdrawal_time": self.user_withdrawal_time.get(address, 0),
            "dev_balance": self.dev_balance,
            "total_liquidity": self.total_liquidity,
            "user_balance_a": self.user_balances.get(address, {HTR_UID: 0}).get(
                HTR_UID, 0
            ),
            "user_balance_b": self.user_balances.get(address, {self.token_b: 0}).get(
                self.token_b, 0
            ),
            "user_lp_b": remove_liquidity_oasis_quote.get("user_lp_b", 0),
            "user_lp_htr": remove_liquidity_oasis_quote.get("user_lp_htr", 0),
            "max_withdraw_b": remove_liquidity_oasis_quote.get("max_withdraw_b", 0),
            "max_withdraw_htr": remove_liquidity_oasis_quote.get("max_withdraw_htr", 0),
        }

    @view
    def oasis_info(self) -> dict[str, float | str]:
        return {
            "total_liquidity": self.total_liquidity,
            "dev_balance": self.dev_balance,
            "token_b": self.token_b.hex(),
            "protocol_fee": self.protocol_fee,  # Added protocol fee to info
        }

    @view
    def front_quote_add_liquidity_in(
        self, amount: int, timelock: int, now: Timestamp, address: Address
    ) -> dict[str, float | bool]:
        """Calculates the bonus for a user based on the timelock and amount"""
        fee_amount = (amount * self.protocol_fee) // 1000
        deposit_amount = amount - fee_amount

        htr_amount = self._quote_add_liquidity_in(deposit_amount)
        bonus = self._get_user_bonus(timelock, htr_amount)

        if address in self.user_withdrawal_time:
            delta = self.user_withdrawal_time[address] - now
            if delta > 0:
                withdrawal_time = (
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
                withdrawal_time = now + timelock * MONTHS_IN_SECONDS
        else:
            withdrawal_time = now + timelock * MONTHS_IN_SECONDS

        return {
            "bonus": bonus,
            "htr_amount": htr_amount,
            "withdrawal_time": withdrawal_time,
            "has_position": address in self.user_withdrawal_time,
            "fee_amount": fee_amount,
            "deposit_amount": deposit_amount,
            "protocol_fee": self.protocol_fee,
        }

    @view
    def get_remove_liquidity_oasis_quote(self, address: Address) -> dict[str, float]:
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
        max_withdraw_b = user_lp_b + self.user_balances[address].get(self.token_b, 0)

        # impermanent loss
        if self.user_deposit_b.get(address, 0) > max_withdraw_b:
            loss = self.user_deposit_b.get(address, 0) - max_withdraw_b
            loss_htr = self.call_view_method(self.dozer_pool, "quote_token_b", loss)
            if loss_htr > user_lp_htr:
                loss_htr = user_lp_htr
            max_withdraw_htr = (
                self.user_balances.get(address, {HTR_UID: 0}).get(HTR_UID, 0) + loss_htr
            )
        # without impermanent loss
        else:
            max_withdraw_htr = self.user_balances.get(address, {HTR_UID: 0}).get(
                HTR_UID, 0
            )

        return {
            "user_lp_b": user_lp_b,
            "user_lp_htr": user_lp_htr,
            "max_withdraw_b": max_withdraw_b,
            "max_withdraw_htr": max_withdraw_htr,
        }
