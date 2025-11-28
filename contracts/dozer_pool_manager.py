from typing import NamedTuple

from hathor import (
    Blueprint,
    BlueprintId,
    Context,
    NCFail,
    Address,
    Amount,
    CallerId,
    NCDepositAction,
    NCWithdrawalAction,
    Timestamp,
    TokenUid,
    NCAction,
    NCActionType,
    public,
    view,
    export,
    HATHOR_TOKEN_UID
)

PRECISION = Amount(10**20)
MINIMUM_LIQUIDITY = Amount(10**3)  # Multiplier for minimum liquidity burn


class PoolState(NamedTuple):
    # Token information
    token_a: TokenUid
    token_b: TokenUid

    # Reserves
    reserve_a: Amount
    reserve_b: Amount

    # Fee configuration
    fee_numerator: Amount
    fee_denominator: Amount

    # Liquidity tracking
    total_liquidity: Amount

    # Total change (excess tokens from slippage)
    total_change_a: Amount
    total_change_b: Amount

    # Pool statistics
    transactions: Amount
    last_activity: int
    volume_a: Amount
    volume_b: Amount


# Custom error classes
class PoolExists(NCFail):
    """Raised when trying to create a pool that already exists."""

    pass


class PoolNotFound(NCFail):
    """Raised when trying to use a pool that doesn't exist."""

    pass


class InvalidTokens(NCFail):
    """Raised when invalid tokens are provided."""

    pass


class InvalidFee(NCFail):
    """Raised when an invalid fee is provided."""

    pass


class InvalidAction(NCFail):
    """Raised when an invalid token action is provided."""

    pass


class InvalidVersion(NCFail):
    pass


class Unauthorized(NCFail):
    """Raised when an unauthorized address tries to perform an action."""

    pass


class InvalidPath(NCFail):
    """Raised when an invalid swap path is provided."""

    pass


class InsufficientLiquidity(NCFail):
    """Raised when there is insufficient liquidity for an operation."""

    pass


class InvalidState(NCFail):
    """Raised when contract is in an invalid state for the operation."""

    pass


class SwapResult(NamedTuple):
    """Result for an executed swap with the details of the execution.

    Notice that the results are presented for tokens in and tokens out.
    So one must check which one is Token A and which one is Token B."""

    amount_in: Amount
    change_in: Amount
    token_in: TokenUid
    amount_out: Amount
    token_out: TokenUid


class PoolApiInfo(NamedTuple):
    """Pool information for frontend API display."""

    reserve0: Amount
    reserve1: Amount
    fee: Amount
    volume: Amount
    fee0: Amount
    fee1: Amount
    dzr_rewards: Amount
    transactions: Amount
    is_signed: Amount
    signer: str | None


class PoolInfo(NamedTuple):
    """Detailed information about a pool."""

    token_a: str
    token_b: str
    reserve_a: Amount | None
    reserve_b: Amount | None
    fee: Amount | None
    total_liquidity: Amount | None
    transactions: Amount | None
    volume_a: Amount | None
    volume_b: Amount | None
    last_activity: int | None
    is_signed: bool
    signer: str | None


class UserInfo(NamedTuple):
    """Detailed information about a user's position in a pool."""

    liquidity: Amount
    token0Amount: Amount
    token1Amount: Amount
    share: Amount
    balance_a: Amount
    balance_b: Amount
    token_a: str
    token_b: str


class UserPosition(NamedTuple):
    """User position information with extended details."""

    liquidity: Amount
    token0Amount: Amount
    token1Amount: Amount
    share: Amount
    balance_a: Amount
    balance_b: Amount
    token_a: str
    token_b: str


class SwapPathInfo(NamedTuple):
    """Information about the best swap path between tokens."""

    path: str
    amounts: list[Amount]
    amount_out: Amount
    price_impact: Amount


class SwapPathExactOutputInfo(NamedTuple):
    """Information about the best swap path for exact output swaps."""

    path: str
    amounts: list[Amount]
    amount_in: Amount
    price_impact: Amount


class UserProfitInfo(NamedTuple):
    """Information about user's profit/loss in a pool."""

    current_value_usd: Amount
    initial_value_usd: Amount
    profit_amount_usd: int
    profit_percentage: int  # With 2 decimal places (e.g., 341 = 3.41%)
    last_action_timestamp: int


class SingleTokenLiquidityQuote(NamedTuple):
    """Quote information for single token liquidity addition."""

    liquidity_amount: Amount
    token_a_used: Amount
    token_b_used: Amount
    excess_token: str  # Token UID in hex
    excess_amount: Amount
    swap_amount: Amount
    swap_output: Amount
    price_impact: Amount  # Price impact percentage in basis points (e.g., 100 = 1%)


class SingleTokenRemovalQuote(NamedTuple):
    """Quote information for single token liquidity removal."""

    amount_out: Amount
    token_a_withdrawn: Amount
    token_b_withdrawn: Amount
    swap_amount: Amount
    swap_output: Amount
    price_impact: Amount  # Price impact percentage in basis points (e.g., 100 = 1%)
    user_liquidity: Amount


@export
class DozerPoolManager(Blueprint):
    """Singleton manager for multiple liquidity pools inspired by Uniswap v2.

    This contract manages multiple liquidity pools in a single contract.
    Each pool is identified by a composite key of token_a/token_b/fee.

    The swap methods are:
    - swap_exact_tokens_for_tokens()
    - swap_tokens_for_exact_tokens()

    Features:
    - Multiple pools in a single contract
    - Protocol fee collection
    - Liquidity management
    - Pool statistics tracking
    - Signed pools for listing in Dozer dApp
    """

    # Version control
    contract_version: str

    # Administrative state
    owner: Address
    default_protocol_fee: Amount
    authorized_signers: set[CallerId]  # Addresses authorized to sign pools
    htr_usd_pool_key: str | None  # Reference pool key for HTR-USD price calculations
    paused: bool  # For emergency pause

    # Pool registry - token_a/token_b/fee -> exists
    pool_exists: set[str]

    # Token registry
    all_pools: list[str]  # List of all pool keys
    token_to_pools: dict[TokenUid, list[str]]  # Token -> list of pool keys

    # Signed pools for dApp listing
    signed_pools: list[str]  # List of all signed pools
    pool_signers: dict[str, CallerId]  # pool_key -> signer_address

    # Price calculation
    htr_token_map: dict[
        TokenUid, str
    ]  # token -> pool_key with lowest fee (for HTR pairs)

    # Pool data
    pools: dict[str, PoolState]  # pool_key -> PoolState (primitives only)

    # Container fields for pool state
    pool_user_liquidity: dict[str, dict[CallerId, Amount]]  # pool_key -> user -> liquidity
    pool_change: dict[str, dict[CallerId, tuple[Amount, Amount]]]  # pool_key -> user -> (balance_a, balance_b)
    pool_accumulated_fee: dict[str, dict[TokenUid, Amount]]  # pool_key -> token -> fee
    pool_user_deposit_price_usd: dict[str, dict[CallerId, Amount]]  # pool_key -> user -> price
    pool_user_last_action_timestamp: dict[str, dict[CallerId, int]]  # pool_key -> user -> timestamp

    @public
    def initialize(self, ctx: Context) -> None:
        """Initialize the DozerPoolManager contract.

        Sets up the initial state for the contract.
        """
        self.contract_version = "1.0.0"
        self.owner = Address(ctx.caller_id)
        self.default_protocol_fee = Amount(40)

        # Initialize dictionaries and lists
        self.authorized_signers: set[CallerId] = set()
        self.pool_exists: set[str] = set()
        self.all_pools: list[str] = []
        self.token_to_pools: dict[TokenUid, list[str]] = {}
        self.signed_pools: list[str] = []
        self.pool_signers: dict[str, CallerId] = {}
        self.htr_token_map: dict[TokenUid, str] = {}
        self.pools: dict[str, PoolState] = {}

        # Container fields for pool state
        self.pool_user_liquidity: dict[str, dict[CallerId, Amount]] = {}
        self.pool_change: dict[str, dict[CallerId, tuple[Amount, Amount]]] = {}
        self.pool_accumulated_fee: dict[str, dict[TokenUid, Amount]] = {}
        self.pool_user_deposit_price_usd: dict[str, dict[CallerId, Amount]] = {}
        self.pool_user_last_action_timestamp: dict[str, dict[CallerId, int]] = {}


        # Add owner as authorized signer
        self.authorized_signers.add(self.owner)

        # Initialize htr_usd_pool_key to None
        self.htr_usd_pool_key = None

        # Initialize pause state
        self.paused = False

    def _get_pool_key(self, token_a: TokenUid, token_b: TokenUid, fee: Amount) -> str:
        """Create a standardized pool key from tokens and fee.

        Args:
            token_a: First token of the pair
            token_b: Second token of the pair
            fee: Fee for the pool

        Returns:
            A composite key in the format token_a:token_b:fee
        """
        # Ensure tokens are ordered
        if token_a > token_b:
            token_a, token_b = token_b, token_a

        # Create composite key
        return f"{token_a.hex()}/{token_b.hex()}/{fee}"

    def _validate_pool_exists(self, pool_key: str) -> None:
        """Check if a pool exists, raising error if not.

        Args:
            pool_key: The pool key to check

        Raises:
            PoolNotFound: If the pool does not exist
        """
        if pool_key not in self.pool_exists:
            raise PoolNotFound(f"Pool does not exist: {pool_key}")

    def _get_actions_a_b(
        self, ctx: Context, pool_key: str
    ) -> tuple[NCAction, NCAction]:
        """Get and validate token actions for a specific pool.

        Args:
            ctx: The transaction context
            pool_key: The pool key

        Returns:
            A tuple of (action_a, action_b)

        Raises:
            InvalidTokens: If the actions don't match the pool tokens
        """
        pool = self.pools[pool_key]
        token_a = pool.token_a
        token_b = pool.token_b

        if set(ctx.actions.keys()) != {token_a, token_b}:
            raise InvalidTokens("Only token_a and token_b are allowed")

        action_a = ctx.get_single_action(token_a)
        action_b = ctx.get_single_action(token_b)

        # Update last activity timestamp
        self.pools[pool_key] = pool._replace(last_activity=int(ctx.block.timestamp))

        return action_a, action_b

    def _get_actions_in_in(
        self, ctx: Context, pool_key: str
    ) -> tuple[NCDepositAction, NCDepositAction]:
        """Return token_a and token_b actions. It also validates that both are deposits.

        Args:
            ctx: The transaction context
            pool_key: The pool key

        Returns:
            A tuple of (action_a, action_b) both deposits

        Raises:
            InvalidAction: If any action is not a deposit
        """
        action_a, action_b = self._get_actions_a_b(ctx, pool_key)
        if action_a.type != NCActionType.DEPOSIT:
            raise InvalidAction("Only deposits allowed for token_a")
        if action_b.type != NCActionType.DEPOSIT:
            raise InvalidAction("Only deposits allowed for token_b")

        # Assert for type narrowing (type already validated above)
        assert isinstance(action_a, NCDepositAction), "action_a must be NCDepositAction"
        assert isinstance(action_b, NCDepositAction), "action_b must be NCDepositAction"

        return action_a, action_b

    def _get_actions_out_out(
        self, ctx: Context, pool_key: str
    ) -> tuple[NCWithdrawalAction, NCWithdrawalAction]:
        """Return token_a and token_b actions. It also validates that both are withdrawals.

        Args:
            ctx: The transaction context
            pool_key: The pool key

        Returns:
            A tuple of (action_a, action_b) both withdrawals

        Raises:
            InvalidAction: If any action is not a withdrawal
        """
        action_a, action_b = self._get_actions_a_b(ctx, pool_key)
        if action_a.type != NCActionType.WITHDRAWAL:
            raise InvalidAction("Only withdrawals allowed for token_a")
        if action_b.type != NCActionType.WITHDRAWAL:
            raise InvalidAction("Only withdrawals allowed for token_b")

        # Assert for type narrowing (type already validated above)
        assert isinstance(action_a, NCWithdrawalAction), "action_a must be NCWithdrawalAction"
        assert isinstance(action_b, NCWithdrawalAction), "action_b must be NCWithdrawalAction"

        return action_a, action_b

    def _get_actions_in_out(
        self, ctx: Context, pool_key: str
    ) -> tuple[NCDepositAction, NCWithdrawalAction]:
        """Return action_in and action_out, where action_in is a deposit and action_out is a withdrawal.

        Args:
            ctx: The transaction context
            pool_key: The pool key

        Returns:
            A tuple of (action_in, action_out)

        Raises:
            InvalidAction: If there isn't exactly one deposit and one withdrawal
        """
        action_a, action_b = self._get_actions_a_b(ctx, pool_key)

        if action_a.type == NCActionType.DEPOSIT:
            action_in = action_a
            action_out = action_b
        else:
            action_in = action_b
            action_out = action_a

        if action_in.type != NCActionType.DEPOSIT:
            raise InvalidAction("Must have one deposit and one withdrawal")
        if action_out.type != NCActionType.WITHDRAWAL:
            raise InvalidAction("Must have one deposit and one withdrawal")

        # Assert for type narrowing (type already validated above)
        assert isinstance(action_in, NCDepositAction), "action_in must be NCDepositAction"
        assert isinstance(action_out, NCWithdrawalAction), "action_out must be NCWithdrawalAction"

        return action_in, action_out

    def _update_change(
        self, address: CallerId, amount: Amount, token: TokenUid, pool_key: str
    ) -> None:
        """Update balance for a given change.

        Args:
            address: The user address
            amount: The amount to update
            token: The token
            pool_key: The pool key
        """
        if amount == 0:
            return

        pool = self.pools[pool_key]

        # Get current balances
        current_balance_a, current_balance_b = self.pool_change[pool_key].get(
            address, (Amount(0), Amount(0))
        )

        if token == pool.token_a:
            # Update balance_a
            new_balance_a = Amount(current_balance_a + amount)
            self.pool_change[pool_key][address] = (new_balance_a, current_balance_b)

            # Update total balance
            new_total_change_a = pool.total_change_a + amount
            self.pools[pool_key] = pool._replace(
                total_change_a=Amount(new_total_change_a)
            )
        else:
            # Ensure token is valid for this pool
            assert token == pool.token_b, f"Token {token} is not part of pool {pool_key}"

            # Update balance_b
            new_balance_b = Amount(current_balance_b + amount)
            self.pool_change[pool_key][address] = (current_balance_a, new_balance_b)

            # Update total balance
            new_total_change_b = pool.total_change_b + amount
            self.pools[pool_key] = pool._replace(
                total_change_b=Amount(new_total_change_b)
            )

    def _get_reserve(self, token_uid: TokenUid, pool_key: str) -> Amount:
        """Get the reserve for a token in a pool.

        Args:
            token_uid: The token
            pool_key: The pool key

        Returns:
            The reserve amount

        Raises:
            InvalidTokens: If the token is not part of the pool
        """
        pool = self.pools[pool_key]
        if token_uid == pool.token_a:
            return pool.reserve_a
        elif token_uid == pool.token_b:
            return pool.reserve_b
        else:
            raise InvalidTokens("Token not in pool")

    def _update_reserve(
        self, amount: Amount, token_uid: TokenUid, pool_key: str
    ) -> None:
        """Update reserve for a token in a pool.

        Args:
            amount: The amount to update
            token_uid: The token
            pool_key: The pool key

        Raises:
            InvalidTokens: If the token is not part of the pool
        """
        pool = self.pools[pool_key]
        if token_uid == pool.token_a:
            self.pools[pool_key] = pool._replace(
                reserve_a=Amount(pool.reserve_a + amount)
            )
        elif token_uid == pool.token_b:
            self.pools[pool_key] = pool._replace(
                reserve_b=Amount(pool.reserve_b + amount)
            )
        else:
            raise InvalidTokens("Token not in pool")

    def _update_user_profit_tracking(
        self, user_address: CallerId, pool_key: str, ctx: Context
    ) -> None:
        """Update user profit tracking information after liquidity operations.

        Args:
            user_address: The user address
            pool_key: The pool key
            ctx: The transaction context
        """
        # Calculate current USD value of user's position
        current_usd_value = self._calculate_user_position_usd_value(user_address, pool_key)

        # Update the stored USD price 
        self.pool_user_deposit_price_usd[pool_key][user_address] = current_usd_value

        # Update timestamp 
        self.pool_user_last_action_timestamp[pool_key][user_address] = int(ctx.block.timestamp)

    def _calculate_user_position_usd_value(
        self, user_address: CallerId, pool_key: str
    ) -> Amount:
        """Calculate the current USD value of a user's position in a pool.

        Args:
            user_address: The user address
            pool_key: The pool key

        Returns:
            The USD value of the user's position
        """
        pool = self.pools[pool_key]

        # Get user liquidity from blueprint attribute
        user_liquidity = self.pool_user_liquidity[pool_key].get(user_address, Amount(0))
        if user_liquidity == 0:
            return Amount(0)

        if pool.total_liquidity == 0:
            return Amount(0)

        # Calculate user's share of the pool
        user_token_a_amount = (pool.reserve_a * user_liquidity) // pool.total_liquidity
        user_token_b_amount = (pool.reserve_b * user_liquidity) // pool.total_liquidity

        # Get token prices in USD
        token_a_price_usd = self.get_token_price_in_usd(pool.token_a)
        token_b_price_usd = self.get_token_price_in_usd(pool.token_b)

        # Calculate total USD value (prices have 8 decimal places)
        value_a_usd = (user_token_a_amount * token_a_price_usd) // 100_000000
        value_b_usd = (user_token_b_amount * token_b_price_usd) // 100_000000

        total_value = value_a_usd + value_b_usd

        return Amount(total_value)

    @view
    def quote(self, amount_a: Amount, reserve_a: Amount, reserve_b: Amount) -> Amount:
        """Return amount_b such that amount_b/amount_a = reserve_b/reserve_a = k

        Args:
            amount_a: The amount of token A
            reserve_a: The reserve of token A
            reserve_b: The reserve of token B

        Returns:
            The equivalent amount of token B
        """
        amount_b = (amount_a * reserve_b) // reserve_a
        return Amount(amount_b)

    def _check_k_not_decreased(
        self,
        k_before: Amount,
        k_after: Amount,
        operation: str
    ) -> None:
        """Check that K (reserve_a * reserve_b) has not decreased after a swap.

        In AMM swaps, the constant product K should increase slightly due to swap fees
        being added to reserves. This check ensures K never decreases, which would
        indicate a bug in the swap logic.

        Args:
            k_before: K value before the swap operation
            k_after: K value after the swap operation
            operation: Description of the operation (for error messages)

        Raises:
            AssertionError: If K decreased during the swap
        """
        # For swaps: K should not decrease (fees increase it slightly)
        assert k_after >= k_before, \
            f"K decreased in {operation}: {k_before} -> {k_after} (delta: {k_before - k_after})"

    def _check_price_ratio(
        self,
        reserve_a_before: Amount,
        reserve_b_before: Amount,
        reserve_a_after: Amount,
        reserve_b_after: Amount,
        operation: str
    ) -> None:
        """Check that the price ratio is maintained during liquidity operations.

        During proportional liquidity operations (add/remove liquidity), the ratio
        reserve_a/reserve_b should remain constant to ensure the pool price doesn't change.

        This check uses cross-multiplication to avoid floating-point precision issues:
        ratio_a/ratio_b is constant if: reserve_a_before * reserve_b_after == reserve_a_after * reserve_b_before

        Due to integer division rounding in quote() calculations, a small tolerance (0.0001%)
        is allowed to account for inevitable rounding errors while still catching real violations.

        Args:
            reserve_a_before: Reserve A before the operation
            reserve_b_before: Reserve B before the operation
            reserve_a_after: Reserve A after the operation
            reserve_b_after: Reserve B after the operation
            operation: Description of the operation (for error messages)

        Raises:
            AssertionError: If the price ratio changed beyond the allowed tolerance
        """
        ratio_check_before = reserve_a_before * reserve_b_after
        ratio_check_after = reserve_a_after * reserve_b_before

        # Calculate absolute difference
        diff = abs(ratio_check_before - ratio_check_after)

        max_value = max(ratio_check_before, ratio_check_after)

        assert diff * 10000000 <= max_value, \
            f"Price ratio violation in {operation}: ratio changed from {reserve_a_before}/{reserve_b_before} to {reserve_a_after}/{reserve_b_after} (diff: {diff})"

    @view
    def get_amount_out(
        self,
        amount_in: Amount,
        reserve_in: Amount,
        reserve_out: Amount,
        fee_numerator: int,
        fee_denominator: int,
    ) -> Amount:
        """Return the maximum amount_out for an exact amount_in.

        Args:
            amount_in: The input amount
            reserve_in: The input reserve
            reserve_out: The output reserve
            fee_numerator: The fee numerator
            fee_denominator: The fee denominator

        Returns:
            The output amount
        """
        a = fee_denominator - fee_numerator
        b = fee_denominator
        amount_out = (reserve_out * amount_in * a) // (reserve_in * b + amount_in * a)
        # This condition is mathematically impossible given the constant product formula
        assert amount_out <= reserve_out, f"Impossible: amount_out ({amount_out}) > reserve_out ({reserve_out})"
        return Amount(amount_out)

    @view
    def get_amount_in(
        self,
        amount_out: Amount,
        reserve_in: Amount,
        reserve_out: Amount,
        fee_numerator: int,
        fee_denominator: int,
    ) -> Amount:
        """Return the minimum amount_in for an exact amount_out.

        Args:
            amount_out: The output amount
            reserve_in: The input reserve
            reserve_out: The output reserve
            fee_numerator: The fee numerator
            fee_denominator: The fee denominator

        Returns:
            The input amount
        """
        a = fee_denominator - fee_numerator
        b = fee_denominator
        amount_in = (
            reserve_in * amount_out * b + (reserve_out - amount_out) * a - 1
        ) // ((reserve_out - amount_out) * a)
        return Amount(amount_in)

    @view
    def front_quote_add_liquidity_in(
        self, amount_in: Amount, token_in: TokenUid, pool_key: str
    ) -> Amount:
        """Calculate the amount of other tokens to include for a given input amount in add liquidity event.

        Args:
            amount_in: The amount of input tokens
            token_in: The token to be used as input
            pool_key: The pool key identifying the pool

        Returns:
            The calculated amount of other tokens to include

        Raises:
            PoolNotFound: If the pool does not exist
        """
        if pool_key not in self.all_pools:
            raise PoolNotFound()

        pool = self.pools[pool_key]
        reserve_a = pool.reserve_a
        reserve_b = pool.reserve_b
        token_a = pool.token_a

        if token_in == token_a:
            # Input is token A, calculate required token B
            quote = self.quote(amount_in, reserve_a, reserve_b)
        else:
            # Input is token B, calculate required token A
            quote = self.quote(amount_in, reserve_b, reserve_a)

        return quote

    @view
    def quote_add_liquidity_single_token(
        self, token_in: TokenUid, amount_in: Amount, token_out: TokenUid, fee: Amount
    ) -> SingleTokenLiquidityQuote:
        """Quote liquidity addition with a single token."""
        if token_in == token_out:
            raise InvalidTokens("Input and output tokens cannot be the same")

        if token_in > token_out:
            token_a, token_b = token_out, token_in
        else:
            token_a, token_b = token_in, token_out

        pool_key = self._get_pool_key(token_a, token_b, fee)
        self._validate_pool_exists(pool_key)

        pool = self.pools[pool_key]
        reserve_a = pool.reserve_a
        reserve_b = pool.reserve_b

        if token_in == token_a:
            reserve_in = reserve_a
            reserve_out = reserve_b
        else:
            reserve_in = reserve_b
            reserve_out = reserve_a

        optimal_swap_amount = self._calculate_optimal_swap_amount(
            amount_in, reserve_in, reserve_out, fee
        )

        swap_amount_out = self.get_amount_out(
            optimal_swap_amount,
            reserve_in,
            reserve_out,
            pool.fee_numerator,
            pool.fee_denominator,
        )

        if token_in == token_a:
            token_a_amount = amount_in - optimal_swap_amount
            token_b_amount = swap_amount_out
            reserve_a_after_swap = reserve_a + optimal_swap_amount
            reserve_b_after_swap = reserve_b - swap_amount_out
        else:
            token_b_amount = Amount(amount_in - optimal_swap_amount)
            token_a_amount = swap_amount_out
            reserve_a_after_swap = reserve_a - swap_amount_out
            reserve_b_after_swap = reserve_b + optimal_swap_amount

        total_liquidity = pool.total_liquidity

        if total_liquidity == 0:
            liquidity_increase = Amount(0)
            actual_a = Amount(0)
            actual_b = Amount(0)
        else:
            liquidity_a = (total_liquidity * token_a_amount) // reserve_a_after_swap if reserve_a_after_swap > 0 else 0
            liquidity_b = (total_liquidity * token_b_amount) // reserve_b_after_swap if reserve_b_after_swap > 0 else 0
            liquidity_increase = Amount(min(liquidity_a, liquidity_b))

            actual_a = (liquidity_increase * reserve_a_after_swap) // total_liquidity if total_liquidity > 0 else Amount(0)
            actual_b = (liquidity_increase * reserve_b_after_swap) // total_liquidity if total_liquidity > 0 else Amount(0)

        excess_a = Amount(token_a_amount - actual_a)
        excess_b = Amount(token_b_amount - actual_b)

        if excess_a > 0:
            excess_token = token_a
            excess_amount = excess_a
        elif excess_b > 0:
            excess_token = token_b
            excess_amount = excess_b
        else:
            excess_token = token_in
            excess_amount = Amount(0)

        # Calculate value-based price impact (shows real value loss to user)
        price_impact = self._calculate_value_based_price_impact(
            amount_in, token_in, Amount(actual_a), Amount(actual_b), token_a, token_b
        )

        return SingleTokenLiquidityQuote(
            liquidity_amount=liquidity_increase,
            token_a_used=Amount(actual_a),
            token_b_used=Amount(actual_b),
            excess_token=excess_token.hex(),
            excess_amount=excess_amount,
            swap_amount=optimal_swap_amount,
            swap_output=swap_amount_out,
            price_impact=price_impact,
        )

    @view
    def quote_remove_liquidity_single_token(
        self, user_address: CallerId, token_a: TokenUid, token_b: TokenUid, token_out: TokenUid, fee: Amount
    ) -> SingleTokenRemovalQuote:
        """Quote liquidity removal to receive a single token."""
        if token_out != token_a and token_out != token_b:
            raise InvalidTokens("token_out must be either token_a or token_b")

        pool_key = self._get_pool_key(token_a, token_b, fee)
        self._validate_pool_exists(pool_key)

        pool = self.pools[pool_key]
        user_liquidity = self.pool_user_liquidity[pool_key].get(user_address, Amount(0))
        if user_liquidity == 0:
            raise InvalidAction("No liquidity to remove")

        total_liquidity = pool.total_liquidity
        reserve_a = pool.reserve_a
        reserve_b = pool.reserve_b

        amount_a = Amount((reserve_a * user_liquidity) // total_liquidity)
        amount_b = Amount((reserve_b * user_liquidity) // total_liquidity)

        if token_out == token_a:
            if amount_b > 0:
                new_reserve_a = Amount(reserve_a - amount_a)
                new_reserve_b = Amount(reserve_b - amount_b)

                swap_reserve_in = Amount(new_reserve_b + amount_b)
                swap_reserve_out = Amount(new_reserve_a)

                extra_a = self.get_amount_out(
                    amount_b,
                    swap_reserve_in,
                    swap_reserve_out,
                    pool.fee_numerator,
                    pool.fee_denominator,
                )
                total_amount_out = Amount(amount_a + extra_a)
                swap_amount = amount_b
                swap_output = extra_a

                price_impact = self._calculate_single_swap_price_impact(
                    swap_amount, swap_output, new_reserve_b, new_reserve_a
                )
            else:
                total_amount_out = amount_a
                swap_amount = Amount(0)
                swap_output = Amount(0)
                price_impact = Amount(0)
        else:
            if amount_a > 0:
                new_reserve_a = reserve_a - amount_a
                new_reserve_b = reserve_b - amount_b

                swap_reserve_in = Amount(new_reserve_a + amount_a)
                swap_reserve_out = Amount(new_reserve_b)

                extra_b = self.get_amount_out(
                    amount_a,
                    swap_reserve_in,
                    swap_reserve_out,
                    pool.fee_numerator,
                    pool.fee_denominator,
                )
                total_amount_out = Amount(amount_b + extra_b)
                swap_amount = amount_a
                swap_output = extra_b

                price_impact = self._calculate_single_swap_price_impact(
                    swap_amount, swap_output, Amount(new_reserve_a), Amount(new_reserve_b)
                )
            else:
                total_amount_out = amount_b
                swap_amount = Amount(0)
                swap_output = Amount(0)
                price_impact = Amount(0)

        return SingleTokenRemovalQuote(
            amount_out=total_amount_out,
            token_a_withdrawn=amount_a,
            token_b_withdrawn=amount_b,
            swap_amount=swap_amount,
            swap_output=swap_output,
            price_impact=price_impact,
            user_liquidity=user_liquidity,
        )

    @view
    def quote_remove_liquidity_single_token_percentage(
        self, user_address: CallerId, pool_key: str, token_out: TokenUid, percentage: Amount
    ) -> SingleTokenRemovalQuote:
        """Quote liquidity removal to receive a single token based on percentage."""
        self._validate_pool_exists(pool_key)

        if percentage <= 0 or percentage > 10000:
            raise InvalidAction("Invalid percentage")

        pool = self.pools[pool_key]
        token_a = pool.token_a
        token_b = pool.token_b

        if token_out != token_a and token_out != token_b:
            raise InvalidTokens("token_out must be either token_a or token_b")

        user_liquidity = self.pool_user_liquidity[pool_key].get(user_address, 0)
        if user_liquidity == 0:
            raise InvalidAction("No liquidity to remove")

        liquidity_to_remove = (user_liquidity * percentage) // 10000

        total_liquidity = pool.total_liquidity
        reserve_a = pool.reserve_a
        reserve_b = pool.reserve_b

        amount_a = Amount((reserve_a * liquidity_to_remove) // total_liquidity)
        amount_b = Amount((reserve_b * liquidity_to_remove) // total_liquidity)

        if token_out == token_a:
            if amount_b > 0:
                new_reserve_a = Amount(reserve_a - amount_a)
                new_reserve_b = Amount(reserve_b - amount_b)

                swap_reserve_in = Amount(new_reserve_b + amount_b)
                swap_reserve_out = Amount(new_reserve_a)

                extra_a = self.get_amount_out(
                    amount_b,
                    swap_reserve_in,
                    swap_reserve_out,
                    pool.fee_numerator,
                    pool.fee_denominator,
                )
                total_amount_out = amount_a + extra_a
                swap_amount = amount_b
                swap_output = extra_a

                price_impact = self._calculate_single_swap_price_impact(
                    swap_amount, swap_output, new_reserve_b, new_reserve_a
                )
            else:
                total_amount_out = amount_a
                swap_amount = Amount(0)
                swap_output = Amount(0)
                price_impact = Amount(0)
        else:
            if amount_a > 0:
                new_reserve_a = reserve_a - amount_a
                new_reserve_b = reserve_b - amount_b

                swap_reserve_in = Amount(new_reserve_a + amount_a)
                swap_reserve_out = Amount(new_reserve_b)

                extra_b = self.get_amount_out(
                    amount_a,
                    swap_reserve_in,
                    swap_reserve_out,
                    pool.fee_numerator,
                    pool.fee_denominator,
                )
                total_amount_out = amount_b + extra_b
                swap_amount = amount_a
                swap_output = extra_b

                price_impact = self._calculate_single_swap_price_impact(
                    swap_amount, swap_output, Amount(new_reserve_a), Amount(new_reserve_b)
                )
            else:
                total_amount_out = amount_b
                swap_amount = Amount(0)
                swap_output = Amount(0)
                price_impact = Amount(0)

        return SingleTokenRemovalQuote(
            amount_out=Amount(total_amount_out),
            token_a_withdrawn=amount_a,
            token_b_withdrawn=amount_b,
            swap_amount=swap_amount,
            swap_output=swap_output,
            price_impact=price_impact,
            user_liquidity=Amount(user_liquidity),
        )

    @view
    def front_quote_add_liquidity_out(
        self, amount_out: Amount, token_in: TokenUid, pool_key: str
    ) -> Amount:
        """Calculate the amount of other tokens to include for a given output amount in add liquidity event.

        Args:
            amount_out: The amount of output tokens
            token_in: The token to be used as input
            pool_key: The pool key identifying the pool

        Returns:
            The calculated amount of other tokens to include

        Raises:
            PoolNotFound: If the pool does not exist
        """
        if pool_key not in self.all_pools:
            raise PoolNotFound()

        pool = self.pools[pool_key]
        reserve_a = pool.reserve_a
        reserve_b = pool.reserve_b
        token_a = pool.token_a

        if token_in == token_a:
            # Input is token A, calculate required token A for given token B output
            quote = self.quote(amount_out, reserve_b, reserve_a)
        else:
            # Input is token B, calculate required token B for given token A output
            quote = self.quote(amount_out, reserve_a, reserve_b)

        return quote

    def _get_protocol_liquidity_increase(
        self, protocol_fee_amount: Amount, token: TokenUid, pool_key: str
    ) -> Amount:
        """Calculate the liquidity increase equivalent to a defined percentage of the
        collected fee to be minted to the owner address.

        Uses geometric mean: calculates the exact change in sqrt(reserve_a × reserve_b)
        when protocol fee is added to reserves.

        Args:
            protocol_fee_amount: The protocol fee amount in the fee token
            token: The token in which the fee was collected
            pool_key: The pool key

        Returns:
            The liquidity increase to mint to the owner
        """
        pool = self.pools[pool_key]

        # Calculate liquidity increase using exact geometric mean formula
        # ΔL = sqrt((r_a + fee_a) × (r_b + fee_b)) - sqrt(r_a × r_b)
        if token == pool.token_a:
            # Fee collected in token A
            product_after = Amount((pool.reserve_a + protocol_fee_amount) * pool.reserve_b)
            product_before = Amount(pool.reserve_a * pool.reserve_b)
        else:
            # Fee collected in token B
            assert token == pool.token_b, f"Token {token} is not part of pool {pool_key}"
            product_after = Amount(pool.reserve_a * (pool.reserve_b + protocol_fee_amount))
            product_before = Amount(pool.reserve_a * pool.reserve_b)

        # Calculate the change in liquidity using integer square root
        sqrt_after = self._isqrt(product_after)
        sqrt_before = self._isqrt(product_before)
        delta_sqrt = sqrt_after - sqrt_before

        # Scale by PRECISION to match the liquidity units
        liquidity_increase = delta_sqrt * PRECISION

        return Amount(liquidity_increase)

    @public(allow_deposit=True)
    def create_pool(
        self,
        ctx: Context,
        fee: Amount,
    ) -> str:
        """Create a new liquidity pool with initial deposits.

        Args:
            ctx: The transaction context
            token_a: First token of the pair
            token_b: Second token of the pair
            fee: Fee for the pool 

        Returns:
            The pool key

        Raises:
            InvalidTokens: If tokens are invalid
            PoolExists: If the pool already exists
            InvalidFee: If the fee is invalid
        """
        if self.paused and ctx.caller_id != self.owner:
            raise InvalidState("Contract is paused")

        token_a, token_b = set(ctx.actions.keys())

        # Validate tokens
        if token_a == token_b:
            raise InvalidTokens("token_a cannot be equal to token_b")

        # Ensure tokens are ordered
        if token_a > token_b:
            token_a, token_b = token_b, token_a

        # Create pool key
        pool_key = self._get_pool_key(token_a, token_b, fee)

        # Check if pool already exists
        if pool_key in self.pool_exists:
            raise PoolExists("Pool already exists")

        # Validate fee
        if fee > 50:
            raise InvalidFee("Fee too high")
        if fee < 0:
            raise InvalidFee("Invalid fee")

        # Get initial deposits
        if set(ctx.actions.keys()) != {token_a, token_b}:
            raise InvalidTokens("Only token_a and token_b are allowed")

        action_a = ctx.get_single_action(token_a)
        action_b = ctx.get_single_action(token_b)

        if (
            action_a.type != NCActionType.DEPOSIT
            or action_b.type != NCActionType.DEPOSIT
        ):
            raise InvalidAction("Only deposits allowed for initial liquidity")

        # Assert for type narrowing (type already validated above)
        assert isinstance(action_a, NCDepositAction), "action_a must be NCDepositAction"
        assert isinstance(action_b, NCDepositAction), "action_b must be NCDepositAction"

        action_a_amount = Amount(action_a.amount)
        action_b_amount = Amount(action_b.amount)

        # Initialize pool data
        self.pool_exists.add(pool_key)

        # Calculate initial liquidity using geometric mean (sqrt pattern)
        # Formula: initial_liquidity = sqrt(reserve_a * reserve_b) * PRECISION
        # This is the DeFi standard (Uniswap V2, SushiSwap) and treats both tokens equally
        product = Amount(action_a_amount * action_b_amount)
        initial_liquidity = self._isqrt(product) * PRECISION

        # Calculate minimum liquidity to burn
        # Prevents first depositor from withdrawing 100% of reserves
        minimum_liquidity = self._isqrt(product) * MINIMUM_LIQUIDITY
        total_liquidity = initial_liquidity + minimum_liquidity

        # Validate sufficient initial liquidity
        if initial_liquidity == 0:
            raise InvalidAction("Insufficient initial liquidity: amounts too small")

        # Create the pool state with primitive fields only
        self.pools[pool_key] = PoolState(
            token_a=token_a,
            token_b=token_b,
            reserve_a=action_a_amount,
            reserve_b=action_b_amount,
            fee_numerator=fee,
            fee_denominator=Amount(1000),
            total_liquidity=Amount(total_liquidity),
            total_change_a=Amount(0),
            total_change_b=Amount(0),
            transactions=Amount(0),
            last_activity=Timestamp(ctx.block.timestamp),
            volume_a=Amount(0),
            volume_b=Amount(0)
        )

        # Initialize container attributes separately
        # User receives initial_liquidity (not including burned amount)
        self.pool_user_liquidity[pool_key] = {ctx.caller_id: Amount(initial_liquidity)}
        self.pool_change[pool_key] = {}
        self.pool_accumulated_fee[pool_key] = {token_a: Amount(0), token_b: Amount(0)}
        self.pool_user_deposit_price_usd[pool_key] = {}
        self.pool_user_last_action_timestamp[pool_key] = {}

        # Update registry
        # all_pools should already be initialized by the Blueprint system
        self.all_pools.append(pool_key)

        # Update token to pools mapping
        if token_a in self.token_to_pools:
            self.token_to_pools[token_a].append(pool_key)
        else:
            self.token_to_pools[token_a] = [pool_key]

        # For token_b
        if token_b in self.token_to_pools:
            self.token_to_pools[token_b].append(pool_key)
        else:
            self.token_to_pools[token_b] = [pool_key]

        # Update HTR token map if this is an HTR pool
        if token_a == HATHOR_TOKEN_UID or token_b == HATHOR_TOKEN_UID:
            other_token = token_b if token_a == HATHOR_TOKEN_UID else token_a

            # If token not in map or new pool has lower fee, update the map
            current_pool_key = self.htr_token_map.get(other_token)
            if (
                current_pool_key is None
                or self.pools[pool_key].fee_numerator
                < self.pools[current_pool_key].fee_numerator
            ):
                self.htr_token_map[other_token] = pool_key

        return pool_key

    @public(allow_deposit=True)
    def add_liquidity(
        self,
        ctx: Context,
        fee: Amount,
    ) -> tuple[TokenUid, Amount]:
        """Add liquidity to an existing pool.

        Args:
            ctx: The transaction context
            token_a: First token of the pair
            token_b: Second token of the pair
            fee: Fee for the pool

        Returns:
            A tuple of (token, change_amount)

        Raises:
            PoolNotFound: If the pool does not exist
            InvalidAction: If the actions are invalid
        """
        if self.paused and ctx.caller_id != self.owner:
            raise InvalidState("Contract is paused")

        token_a, token_b = set(ctx.actions.keys())
        user_address = ctx.caller_id

        # Ensure tokens are ordered
        if token_a > token_b:
            token_a, token_b = token_b, token_a

        pool_key = self._get_pool_key(token_a, token_b, fee)
        self._validate_pool_exists(pool_key)

        pool = self.pools[pool_key]

        action_a, action_b = self._get_actions_in_in(ctx, pool_key)

        # This logic mirrors Dozer_Pool_v1_1.add_liquidity
        reserve_a = pool.reserve_a
        reserve_b = pool.reserve_b

        action_a_amount = Amount(action_a.amount)
        action_b_amount = Amount(action_b.amount)

        optimal_b = self.quote(action_a_amount, reserve_a, reserve_b)
        if optimal_b <= action_b_amount:
            change = action_b_amount - optimal_b
            self._update_change(
                user_address, change, pool.token_b, pool_key
            )
            pool = self.pools[pool_key]  # Refresh after _update_change

            # Calculate liquidity increase
            liquidity_increase = (
                pool.total_liquidity * action_a_amount // reserve_a
            )

            # Update user liquidity
            user_liquidity = self.pool_user_liquidity[pool_key]
            user_liquidity[user_address] = Amount(
                user_liquidity.get(user_address, Amount(0)) + liquidity_increase
            )

            # Update pool state with all changes
            self.pools[pool_key] = pool._replace(
                total_liquidity=Amount(pool.total_liquidity + liquidity_increase),
                reserve_a=Amount(pool.reserve_a + action_a_amount),
                reserve_b=Amount(pool.reserve_b + optimal_b)
            )

            # Update profit tracking after liquidity has been added
            self._update_user_profit_tracking(user_address, pool_key, ctx)

            # Verify price ratio remains constant (proportional liquidity addition)
            pool_after = self.pools[pool_key]
            self._check_price_ratio(reserve_a, reserve_b, pool_after.reserve_a, pool_after.reserve_b, "add_liquidity")

            return (pool.token_b, change)
        else:
            optimal_a = self.quote(action_b_amount, reserve_b, reserve_a)

            # Validate optimal_a is not greater than action_a.amount
            if optimal_a > action_a_amount:
                raise InvalidAction("Insufficient token A amount")

            change = action_a_amount - optimal_a
            self._update_change(
                user_address, change, pool.token_a, pool_key
            )
            pool = self.pools[pool_key]  # Refresh after _update_change

            # Calculate liquidity increase
            liquidity_increase = (
                pool.total_liquidity * optimal_a // reserve_a
            )

            # Update user liquidity
            user_liquidity = self.pool_user_liquidity[pool_key]
            user_liquidity[user_address] = Amount(
                user_liquidity.get(user_address, Amount(0)) + liquidity_increase
            )

            # Update pool state with all changes
            self.pools[pool_key] = pool._replace(
                total_liquidity=Amount(pool.total_liquidity + liquidity_increase),
                reserve_a=Amount(pool.reserve_a + optimal_a),
                reserve_b=Amount(pool.reserve_b + action_b_amount)
            )

            # Update profit tracking after liquidity has been added
            self._update_user_profit_tracking(user_address, pool_key, ctx)

            # Verify price ratio remains constant (proportional liquidity addition)
            pool_after = self.pools[pool_key]
            self._check_price_ratio(reserve_a, reserve_b, pool_after.reserve_a, pool_after.reserve_b, "add_liquidity")

            return (pool.token_a, change)

    @public(allow_withdrawal=True)
    def remove_liquidity(
        self,
        ctx: Context,
        fee: Amount,
    ) -> tuple[TokenUid, Amount]:
        """Remove liquidity from a pool.

        Args:
            ctx: The transaction context
            token_a: First token of the pair
            token_b: Second token of the pair
            fee: Fee for the pool

        Raises:
            PoolNotFound: If the pool does not exist
            InvalidAction: If the user has no liquidity or insufficient liquidity
        """
        if self.paused and ctx.caller_id != self.owner:
            raise InvalidState("Contract is paused")

        token_a, token_b = set(ctx.actions.keys())
        user_address = ctx.caller_id

        # Ensure tokens are ordered
        if token_a > token_b:
            token_a, token_b = token_b, token_a

        pool_key = self._get_pool_key(token_a, token_b, fee)
        self._validate_pool_exists(pool_key)

        pool = self.pools[pool_key]

        # Capture reserves before operation
        reserve_a_before = pool.reserve_a
        reserve_b_before = pool.reserve_b

        action_a, action_b = self._get_actions_out_out(ctx, pool_key)

        # Check if user has liquidity
        user_liquidity = self.pool_user_liquidity[pool_key]
        if (
            user_address not in user_liquidity
            or user_liquidity[user_address] == 0
        ):
            raise InvalidAction("No liquidity to remove")

        # Calculate maximum withdrawal
        max_withdraw = (
            user_liquidity[user_address]
            * pool.reserve_a
            // pool.total_liquidity
        )

        action_a_amount = Amount(action_a.amount)
        action_b_amount = Amount(action_b.amount)

        if max_withdraw < action_a_amount:
            raise InvalidAction(
                f"Insufficient liquidity: {max_withdraw} < {action_a_amount}"
            )

        optimal_b = self.quote(
            action_a_amount,
            pool.reserve_a,
            pool.reserve_b,
        )

        if optimal_b < action_b_amount:
            raise InvalidAction("Insufficient token B amount")

        change = optimal_b - action_b_amount

        self._update_change(
            user_address, change, pool.token_b, pool_key
        )
        pool = self.pools[pool_key]  # Refresh after _update_change

        # Calculate liquidity decrease
        liquidity_decrease = (
            pool.total_liquidity
            * action_a_amount
            // pool.reserve_a
        )

        # Update user liquidity
        user_liquidity = self.pool_user_liquidity[pool_key]
        user_liquidity[user_address] = Amount(
            user_liquidity.get(user_address, Amount(0)) - liquidity_decrease
        )

        # Update pool state with all changes
        self.pools[pool_key] = pool._replace(
            total_liquidity=Amount(pool.total_liquidity - liquidity_decrease),
            reserve_a=Amount(pool.reserve_a - action_a_amount),
            reserve_b=Amount(pool.reserve_b - optimal_b)
        )

        # Update profit tracking after liquidity has been removed
        self._update_user_profit_tracking(user_address, pool_key, ctx)

        # Verify price ratio remains constant (proportional liquidity removal)
        pool_after = self.pools[pool_key]
        self._check_price_ratio(reserve_a_before, reserve_b_before, pool_after.reserve_a, pool_after.reserve_b, "remove_liquidity")

        return (token_a, change)

    @public(allow_deposit=True)
    def add_liquidity_single_token(
        self,
        ctx: Context,
        token_out: TokenUid,
        fee: Amount,
    ) -> tuple[TokenUid, Amount]:
        """Add liquidity to a pool using only one token.

        This method allows users to provide liquidity with just one token from the pair.
        Half of the input token is swapped to the other token, then liquidity is added
        using both tokens in the correct ratio.

        The internal swap has a hard-coded maximum price impact of 15% (1500 basis points)
        to protect users from excessive losses.

        Args:
            ctx: The transaction context (should contain deposit of one token)
            token_out: The other token in the pool (not the deposited one)
            fee: Fee for the pool

        Returns:
            A tuple of (token, change_amount) for any excess tokens

        Raises:
            PoolNotFound: If the pool does not exist
            InvalidAction: If the actions are invalid or price impact too high (>15%)
            InvalidTokens: If the tokens are invalid
        """
        if self.paused and ctx.caller_id != self.owner:
            raise InvalidState("Contract is paused")

        # Get the single deposit action
        if len(ctx.actions) != 1:
            raise InvalidAction("Must provide exactly one token deposit")

        deposit_action = list(ctx.actions.values())[0][0]
        if not isinstance(deposit_action, NCDepositAction):
            raise InvalidAction("Must provide a deposit action")

        token_in = deposit_action.token_uid
        amount_in = deposit_action.amount
        user_address = ctx.caller_id

        # Validate tokens and get pool key
        if token_in == token_out:
            raise InvalidTokens("Input and output tokens cannot be the same")

        # Ensure tokens are ordered
        if token_in > token_out:
            token_a, token_b = token_out, token_in
        else:
            token_a, token_b = token_in, token_out

        pool_key = self._get_pool_key(token_a, token_b, fee)
        self._validate_pool_exists(pool_key)

        pool = self.pools[pool_key]

        # Capture K before internal swap (should increase due to swap fees)
        k_before_swap = Amount(pool.reserve_a * pool.reserve_b)

        # Get current reserves
        reserve_a = pool.reserve_a
        reserve_b = pool.reserve_b

        # Calculate how much to swap (approximately half the input)
        # We need to find the optimal amount to swap so that the resulting tokens
        # are in the correct ratio for the pool
        if token_in == token_a:
            # Input is token A, need to swap some A for B
            reserve_in = reserve_a
            reserve_out = reserve_b
        else:
            # Input is token B, need to swap some B for A
            reserve_in = reserve_b
            reserve_out = reserve_a

        # Calculate optimal swap amount using quadratic formula
        # This ensures we get the right ratio after the swap
        optimal_swap_amount = self._calculate_optimal_swap_amount(
            Amount(amount_in), reserve_in, reserve_out, fee
        )

        # Execute the internal swap
        swap_amount_out = self.get_amount_out(
            optimal_swap_amount,
            reserve_in,
            reserve_out,
            pool.fee_numerator,
            pool.fee_denominator,
        )

        # Validate price impact of internal swap (max 15% = 1500 basis points)
        price_impact = self._calculate_single_swap_price_impact(
            optimal_swap_amount, swap_amount_out, reserve_in, reserve_out
        )
        MAX_PRICE_IMPACT = Amount(1500)  # 15% in basis points
        if price_impact > MAX_PRICE_IMPACT:
            raise InvalidAction("Price impact too high - internal swap exceeds 15% impact")

        # Update reserves for the internal swap
        if token_in == token_a:
            self.pools[pool_key] = pool._replace(
                reserve_a=Amount(reserve_a + optimal_swap_amount),
                reserve_b=Amount(reserve_b - swap_amount_out)
            )
            token_a_amount = amount_in - optimal_swap_amount
            token_b_amount = swap_amount_out
        else:
            self.pools[pool_key] = pool._replace(
                reserve_b=Amount(reserve_b + optimal_swap_amount),
                reserve_a=Amount(reserve_a - swap_amount_out)
            )
            token_b_amount = amount_in - optimal_swap_amount
            token_a_amount = swap_amount_out

        # Re-fetch pool after swap update
        pool = self.pools[pool_key]

        # Verify K didn't decrease during internal swap
        k_after_swap = Amount(pool.reserve_a * pool.reserve_b)
        self._check_k_not_decreased(k_before_swap, k_after_swap, "add_liquidity_single_token (internal swap)")

        current_reserve_a = pool.reserve_a
        current_reserve_b = pool.reserve_b
        total_liquidity = pool.total_liquidity

        liquidity_a = (total_liquidity * token_a_amount) // current_reserve_a
        liquidity_b = (total_liquidity * token_b_amount) // current_reserve_b

        # Use whichever token is limiting to avoid double rounding
        if liquidity_a <= liquidity_b:
            liquidity_increase = liquidity_a
            actual_a = token_a_amount
            actual_b = (liquidity_increase * current_reserve_b) // total_liquidity
            excess_a = Amount(0)
            excess_b = Amount(token_b_amount - actual_b)
        else:
            liquidity_increase = liquidity_b
            actual_b = token_b_amount
            actual_a = (liquidity_increase * current_reserve_a) // total_liquidity
            excess_a = Amount(token_a_amount - actual_a)
            excess_b = Amount(0)

        # Update user liquidity
        user_liquidity = self.pool_user_liquidity[pool_key]
        user_liquidity[user_address] = Amount(
            user_liquidity.get(user_address, Amount(0)) + liquidity_increase
        )

        # Update pool state with all changes
        self.pools[pool_key] = pool._replace(
            total_liquidity=Amount(total_liquidity + liquidity_increase),
            reserve_a=Amount(current_reserve_a + actual_a),
            reserve_b=Amount(current_reserve_b + actual_b)
        )

        # Store excess tokens in user balance (only store non-zero amounts)
        if excess_a > 0:
            self._update_change(user_address, excess_a, token_a, pool_key)
        if excess_b > 0:
            self._update_change(user_address, excess_b, token_b, pool_key)

        # Update profit tracking
        self._update_user_profit_tracking(user_address, pool_key, ctx)

        # Note: We don't check price ratio here because the liquidity addition
        # uses actual_a and actual_b which are rounded down from the available tokens.
        # Any excess is stored in user balance. The ratio might change slightly due
        # to integer rounding, but this is acceptable and handled correctly.

        # Return the excess token info
        if excess_a > 0:
            return (token_a, excess_a)
        elif excess_b > 0:
            return (token_b, excess_b)
        else:
            return (token_in, Amount(0))

    def _isqrt(self, n: Amount) -> Amount:
        """
        Integer square root using Newton's method (Babylonian algorithm).
        Same algorithm used in Uniswap V2 and other DeFi protocols.

        Returns the largest integer x such that x² ≤ n.
        """
        if n == 0:
            return Amount(0)

        # Initial guess
        x = Amount(n)
        y = Amount((x + 1) // 2)

        while y < x:
            x = y
            y = Amount((x + n // x) // 2)

        return x

    def _calculate_optimal_swap_amount(
        self, amount_in: Amount, reserve_in: Amount, reserve_out: Amount, fee: Amount
    ) -> Amount:
        """
        Calculate optimal swap amount using Uniswap's proven formula with integer math.

        This ensures that after swapping, the remaining tokens are in perfect ratio
        with the pool, resulting in minimal excess (<0.2% typically).

        Formula: optimal = (sqrt(reserve_in * (reserve_in * fee_denom² + amount_in * fee_denom * fee_mult)) - reserve_in * fee_denom) / fee_mult

        Where:
        - fee_denom = 1000
        - fee_mult = 1000 - fee (e.g., 997 for 0.3% fee)
        """
        fee_denominator = Amount(1000)
        if fee >= fee_denominator:
            return Amount(0)

        if amount_in == 0 or reserve_in == 0:
            return Amount(0)

        fee_multiplier = Amount(fee_denominator - fee)

        # Calculate: reserve_in * fee_denom²
        term1 = reserve_in * fee_denominator * fee_denominator

        # Calculate: amount_in * fee_denom * fee_mult
        term2 = amount_in * fee_denominator * fee_multiplier

        # Calculate: reserve_in * (term1 + term2)
        under_sqrt = Amount(reserve_in * (term1 + term2))

        # Take integer square root
        sqrt_k = self._isqrt(under_sqrt)

        # Calculate: (sqrt_k - reserve_in * fee_denom) / fee_mult
        numerator = Amount(sqrt_k - (reserve_in * fee_denominator))

        if numerator <= 0:
            return Amount(0)

        optimal = Amount(numerator // fee_multiplier)

        # Safety check
        if optimal > amount_in:
            optimal = Amount(amount_in // 2)

        return optimal

    def _calculate_single_swap_price_impact(
        self, amount_in: Amount, amount_out: Amount, reserve_in: Amount, reserve_out: Amount
    ) -> Amount:
        """Calculate price impact of internal swap in basis points (100 = 1%).

        Price impact = (1 - execution_price / spot_price) * 10000
        """
        if amount_in == 0 or amount_out == 0 or reserve_in == 0 or reserve_out == 0:
            return Amount(0)

        numerator = amount_out * reserve_in
        denominator = amount_in * reserve_out

        if denominator == 0 or numerator >= denominator:
            return Amount(0)

        price_impact = ((denominator - numerator) * 10000) // denominator
        return Amount(price_impact)

    def _calculate_value_based_price_impact(
        self,
        amount_in: Amount,
        token_in: TokenUid,
        actual_a: Amount,
        actual_b: Amount,
        token_a: TokenUid,
        token_b: TokenUid
    ) -> Amount:
        """
        Calculate the real price impact based on value difference.

        This shows users the actual value loss:
        price_impact = (input_value - position_value) / input_value * 10000

        Returns: Price impact in basis points (100 = 1%)
        """
        # Get token prices in USD (8 decimals)
        token_in_price = self.get_token_price_in_usd(token_in)
        token_a_price = self.get_token_price_in_usd(token_a)
        token_b_price = self.get_token_price_in_usd(token_b)

        if token_in_price == 0:
            return Amount(0)

        # Calculate input value in USD (amounts are in cents, prices have 8 decimals)
        # Result is in cents USD
        input_value_usd = (amount_in * token_in_price) // 100_000000

        # Calculate output value based on actual tokens added to position
        value_a_usd = (actual_a * token_a_price) // 100_000000
        value_b_usd = (actual_b * token_b_price) // 100_000000
        output_value_usd = Amount(value_a_usd + value_b_usd)

        # Price impact = (input_value - output_value) / input_value * 10000
        if input_value_usd == 0:
            return Amount(0)

        if output_value_usd >= input_value_usd:
            return Amount(0)  # No loss

        price_impact = Amount(((input_value_usd - output_value_usd) * 10000) // input_value_usd)
        return price_impact

    @public(allow_withdrawal=True)
    def remove_liquidity_single_token(
        self,
        ctx: Context,
        pool_key: str,
        percentage: Amount,
    ) -> Amount:
        """Remove liquidity from a pool and receive only one token.

        This method allows users to remove a percentage of their liquidity
        and receive only one token. The liquidity is partially removed to get
        both tokens, then one token is swapped for the desired output token.

        The internal swap has a hard-coded maximum price impact of 15% (1500 basis points)
        to protect users from excessive losses.

        Args:
            ctx: The transaction context (should contain withdrawal of desired token)
            pool_key: The pool key (format: token_a/token_b/fee)
            percentage: Percentage of liquidity to remove (in basis points, 10000 = 100%)

        Returns:
            The amount of output tokens received

        Raises:
            PoolNotFound: If the pool does not exist
            InvalidAction: If the actions are invalid or price impact too high (>15%)
        """
        if self.paused and ctx.caller_id != self.owner:
            raise InvalidState("Contract is paused")

        self._validate_pool_exists(pool_key)
        user_address = ctx.caller_id

        # Validate percentage
        if percentage <= 0 or percentage > 10000:
            raise InvalidAction("Invalid percentage")

        # Get the withdrawal action to determine desired token
        if len(ctx.actions) != 1:
            raise InvalidAction("Must provide exactly one token withdrawal")

        withdrawal_action = list(ctx.actions.values())[0][0]
        if not isinstance(withdrawal_action, NCWithdrawalAction):
            raise InvalidAction("Must provide a withdrawal action")

        token_out = withdrawal_action.token_uid
        withdrawal_amount = withdrawal_action.amount

        # Get pool
        pool = self.pools[pool_key]

        # Validate token_out is part of the pool
        token_a = pool.token_a
        token_b = pool.token_b

        if token_out != token_a and token_out != token_b:
            raise InvalidTokens("token_out must be either token_a or token_b")

        # Check if user has liquidity
        pool_user_liquidity = self.pool_user_liquidity[pool_key]
        user_liquidity = pool_user_liquidity.get(user_address, 0)
        if user_liquidity == 0:
            raise InvalidAction("No liquidity to remove")

        # Calculate liquidity to remove based on percentage
        liquidity_to_remove = (user_liquidity * percentage) // 10000

        # Calculate withdrawal amounts based on percentage
        total_liquidity = pool.total_liquidity
        reserve_a = pool.reserve_a
        reserve_b = pool.reserve_b

        # Capture reserves before liquidity removal
        reserve_a_before = reserve_a
        reserve_b_before = reserve_b

        amount_a = Amount((reserve_a * liquidity_to_remove) // total_liquidity)
        amount_b = Amount((reserve_b * liquidity_to_remove) // total_liquidity)

        # Update user liquidity
        pool_user_liquidity[user_address] = Amount(user_liquidity - liquidity_to_remove)
        self.pools[pool_key] = pool._replace(
            total_liquidity=Amount(total_liquidity - liquidity_to_remove),
            reserve_a=Amount(reserve_a - amount_a),
            reserve_b=Amount(reserve_b - amount_b)
        )
        pool = self.pools[pool_key]

        # Verify price ratio maintained during liquidity removal
        self._check_price_ratio(
            reserve_a_before, reserve_b_before,
            pool.reserve_a, pool.reserve_b,
            "remove_liquidity_single_token (liquidity removal)"
        )

        # Capture K and reserves before internal swap
        k_before_swap = Amount(pool.reserve_a * pool.reserve_b)
        reserve_a_before_swap = pool.reserve_a
        reserve_b_before_swap = pool.reserve_b

        # Calculate total output after swapping
        if token_out == token_a:
            # Want token A, swap token B for token A
            if amount_b > 0:
                # Store reserves before swap for price impact calculation
                reserve_b_before_swap = Amount(reserve_b - amount_b)
                reserve_a_before_swap = Amount(reserve_a - amount_a)

                extra_a = self.get_amount_out(
                    amount_b,
                    pool.reserve_b,
                    pool.reserve_a,
                    pool.fee_numerator,
                    pool.fee_denominator,
                )

                # Validate price impact of internal swap (max 15%)
                price_impact = self._calculate_single_swap_price_impact(
                    amount_b, extra_a, reserve_b_before_swap, reserve_a_before_swap
                )
                MAX_PRICE_IMPACT = Amount(1500)  # 15% in basis points
                if price_impact > MAX_PRICE_IMPACT:
                    raise InvalidAction("Price impact too high - internal swap exceeds 15% impact")

                # Update reserves for the swap
                self.pools[pool_key] = pool._replace(
                    reserve_b=Amount(pool.reserve_b + amount_b),
                    reserve_a=Amount(pool.reserve_a - extra_a)
                )
                pool = self.pools[pool_key]
                total_amount_out = amount_a + extra_a
            else:
                total_amount_out = amount_a
        else:
            # Want token B, swap token A for token B
            if amount_a > 0:
                # Store reserves before swap for price impact calculation
                reserve_a_before_swap = Amount(reserve_a - amount_a)
                reserve_b_before_swap = Amount(reserve_b - amount_b)

                extra_b = self.get_amount_out(
                    amount_a,
                    pool.reserve_a,
                    pool.reserve_b,
                    pool.fee_numerator,
                    pool.fee_denominator,
                )

                # Validate price impact of internal swap (max 15%)
                price_impact = self._calculate_single_swap_price_impact(
                    amount_a, extra_b, reserve_a_before_swap, reserve_b_before_swap
                )
                MAX_PRICE_IMPACT = Amount(1500)  # 15% in basis points
                if price_impact > MAX_PRICE_IMPACT:
                    raise InvalidAction("Price impact too high - internal swap exceeds 15% impact")

                # Update reserves for the swap
                self.pools[pool_key] = pool._replace(
                    reserve_a=Amount(pool.reserve_a + amount_a),
                    reserve_b=Amount(pool.reserve_b - extra_b)
                )
                pool = self.pools[pool_key]
                total_amount_out = amount_b + extra_b
            else:
                total_amount_out = amount_b

        # Verify K didn't decrease during internal swap (if swap occurred)
        k_after_swap = Amount(pool.reserve_a * pool.reserve_b)
        self._check_k_not_decreased(k_before_swap, k_after_swap, "remove_liquidity_single_token (internal swap)")

        # Handle slippage - if user requested less than calculated, store excess
        if withdrawal_amount < total_amount_out:
            excess = Amount(total_amount_out - withdrawal_amount)
            self._update_change(user_address, excess, token_out, pool_key)
            total_amount_out = withdrawal_amount
        elif withdrawal_amount > total_amount_out:
            raise InvalidAction("Insufficient output amount")

        # Update profit tracking
        self._update_user_profit_tracking(user_address, pool_key, ctx)

        return Amount(total_amount_out)

    @public(allow_withdrawal=True, allow_deposit=True)
    def swap_exact_tokens_for_tokens(
        self,
        ctx: Context,
        fee: Amount,
        deadline: Timestamp,
    ) -> SwapResult:
        """Swap an exact amount of input tokens for as many output tokens as possible.

        Args:
            ctx: The transaction context
            token_a: First token of the pair
            token_b: Second token of the pair
            fee: Fee for the pool
            deadline: Block timestamp by which transaction must be included

        Returns:
            SwapResult with details of the swap

        Raises:
            PoolNotFound: If the pool does not exist
            InvalidAction: If the actions are invalid or deadline has passed
            InsufficientLiquidity: If there is insufficient liquidity
        """
        if self.paused and ctx.caller_id != self.owner:
            raise InvalidState("Contract is paused")

        # Validate deadline
        if ctx.block.timestamp > deadline:
            raise InvalidAction(f"Transaction expired: block timestamp {ctx.block.timestamp} > deadline {deadline}")

        token_a, token_b = set(ctx.actions.keys())
        user_address = ctx.caller_id

        # Ensure tokens are ordered
        if token_a > token_b:
            token_a, token_b = token_b, token_a

        pool_key = self._get_pool_key(token_a, token_b, fee)
        self._validate_pool_exists(pool_key)

        pool = self.pools[pool_key]
        action_in, action_out = self._get_actions_in_out(ctx, pool_key)
        reserve_in = self._get_reserve(action_in.token_uid, pool_key)
        reserve_out = self._get_reserve(action_out.token_uid, pool_key)

        # Capture K before operation (should increase due to fees)
        k_before = Amount(pool.reserve_a * pool.reserve_b)

        action_in_amount = Amount(action_in.amount)
        min_accepted_amount = Amount(action_out.amount)

        amount_in = action_in_amount
        fee_amount = (
            amount_in * pool.fee_numerator
            + pool.fee_denominator - 1
        ) // pool.fee_denominator

        # Update accumulated fee
        accumulated_fee = self.pool_accumulated_fee[pool_key]
        accumulated_fee[action_in.token_uid] = Amount(
            accumulated_fee.get(action_in.token_uid, 0) + fee_amount
        )

        # Calculate protocol fee with ceiling division only when it would round to zero
        # This ensures protocol gets fair share while maintaining deterministic calculations
        protocol_fee_product = fee_amount * self.default_protocol_fee
        if protocol_fee_product > 0 and protocol_fee_product < 100:
            # Round up to ensure non-zero fee
            protocol_fee_amount = Amount(1)
        else:
            # Normal floor division for larger amounts
            protocol_fee_amount = Amount(protocol_fee_product // 100)

        # Calculate liquidity increase for protocol fee
        liquidity_increase = self._get_protocol_liquidity_increase(
            protocol_fee_amount, action_in.token_uid, pool_key
        )

        # Add liquidity to owner
        user_liquidity = self.pool_user_liquidity[pool_key]
        user_liquidity[self.owner] = Amount(
            user_liquidity.get(self.owner, 0) + liquidity_increase
        )
        self.pools[pool_key] = pool._replace(
            total_liquidity=Amount(pool.total_liquidity + liquidity_increase)
        )
        pool = self.pools[pool_key]

        # Calculate amount out
        amount_out = self.get_amount_out(
            action_in_amount,
            reserve_in,
            reserve_out,
            pool.fee_numerator,
            pool.fee_denominator,
        )

        # Reserve must never reach zero
        if reserve_out <= amount_out:
            raise InsufficientLiquidity("Insufficient liquidity")

        # Check if the requested amount is too high
        if min_accepted_amount > amount_out:
            raise InvalidAction("Amount out is too high")

        # Calculate slippage
        change_in = Amount(amount_out - min_accepted_amount)

        # Update user balance for slippage
        self._update_change(user_address, change_in, action_out.token_uid, pool_key)

        # Update reserves
        self._update_reserve(amount_in, action_in.token_uid, pool_key)
        self._update_reserve(Amount(-amount_out), action_out.token_uid, pool_key)

        # Update statistics
        pool = self.pools[pool_key]
        if action_in.token_uid == pool.token_a:
            self.pools[pool_key] = pool._replace(
                transactions=Amount(pool.transactions + 1),
                volume_a=Amount(pool.volume_a + amount_in)
            )
        else:
            assert action_in.token_uid == pool.token_b, f"Token {action_in.token_uid} is not part of pool {pool_key}"
            self.pools[pool_key] = pool._replace(
                transactions=Amount(pool.transactions + 1),
                volume_b=Amount(pool.volume_b + amount_in)
            )
        pool = self.pools[pool_key]

        # Verify K invariant (should increase due to swap fees)
        k_after = Amount(pool.reserve_a * pool.reserve_b)
        self._check_k_not_decreased(k_before, k_after, "swap_exact_tokens_for_tokens")

        return SwapResult(
            action_in_amount,
            change_in,
            action_in.token_uid,
            amount_out,
            action_out.token_uid,
        )

    @public(allow_withdrawal=True, allow_deposit=True)
    def swap_tokens_for_exact_tokens(
        self,
        ctx: Context,
        fee: Amount,
        deadline: Timestamp,
    ) -> SwapResult:
        """Receive an exact amount of output tokens for as few input tokens as possible.

        Args:
            ctx: The transaction context
            token_a: First token of the pair
            token_b: Second token of the pair
            fee: Fee for the pool
            deadline: Block timestamp by which transaction must be included

        Returns:
            SwapResult with details of the swap

        Raises:
            PoolNotFound: If the pool does not exist
            InvalidAction: If the actions are invalid or deadline has passed
            InsufficientLiquidity: If there is insufficient liquidity
        """
        if self.paused and ctx.caller_id != self.owner:
            raise InvalidState("Contract is paused")

        # Validate deadline
        if ctx.block.timestamp > deadline:
            raise InvalidAction(f"Transaction expired: block timestamp {ctx.block.timestamp} > deadline {deadline}")

        token_a, token_b = set(ctx.actions.keys())
        user_address = ctx.caller_id

        # Ensure tokens are ordered
        if token_a > token_b:
            token_a, token_b = token_b, token_a

        pool_key = self._get_pool_key(token_a, token_b, fee)
        self._validate_pool_exists(pool_key)

        pool = self.pools[pool_key]
        action_in, action_out = self._get_actions_in_out(ctx, pool_key)
        reserve_in = self._get_reserve(action_in.token_uid, pool_key)
        reserve_out = self._get_reserve(action_out.token_uid, pool_key)

        # Capture K before operation (should increase due to fees)
        k_before = Amount(pool.reserve_a * pool.reserve_b)

        action_in_amount = Amount(action_in.amount)
        amount_out = Amount(action_out.amount)

        # Reserve must never reach zero
        if reserve_out <= amount_out:
            raise InsufficientLiquidity("Insufficient liquidity")

        # Calculate amount in
        amount_in = self.get_amount_in(
            amount_out,
            reserve_in,
            reserve_out,
            pool.fee_numerator,
            pool.fee_denominator,
        )

        # Calculate fee amount
        fee_amount = (
            amount_in * pool.fee_numerator
            + pool.fee_denominator - 1
        ) // pool.fee_denominator

        # Update accumulated fee
        accumulated_fee = self.pool_accumulated_fee[pool_key]
        accumulated_fee[action_in.token_uid] = (
            accumulated_fee.get(action_in.token_uid, 0) + fee_amount
        )

        # Calculate protocol fee
        protocol_fee_amount = fee_amount * self.default_protocol_fee // 100

        # Calculate liquidity increase for protocol fee
        liquidity_increase = self._get_protocol_liquidity_increase(
            protocol_fee_amount, action_in.token_uid, pool_key
        )

        # Add liquidity to owner
        user_liquidity = self.pool_user_liquidity[pool_key]
        user_liquidity[self.owner] = Amount(
            user_liquidity.get(self.owner, 0) + liquidity_increase
        )
        self.pools[pool_key] = pool._replace(
            total_liquidity=Amount(pool.total_liquidity + liquidity_increase)
        )
        pool = self.pools[pool_key]

        # Check if the provided amount is sufficient
        if action_in_amount < amount_in:
            raise InvalidAction("Amount in is too low")

        # Calculate slippage
        change_in = action_in_amount - amount_in

        # Update user balance for slippage
        self._update_change(user_address, change_in, action_in.token_uid, pool_key)

        # Update reserves
        self._update_reserve(amount_in, action_in.token_uid, pool_key)
        self._update_reserve(Amount(-amount_out), action_out.token_uid, pool_key)

        # Update statistics
        pool = self.pools[pool_key]
        if action_in.token_uid == pool.token_a:
            self.pools[pool_key] = pool._replace(
                transactions=Amount(pool.transactions + 1),
                volume_a=Amount(pool.volume_a + amount_in)
            )
        else:
            assert action_in.token_uid == pool.token_b, f"Token {action_in.token_uid} is not part of pool {pool_key}"
            self.pools[pool_key] = pool._replace(
                transactions=Amount(pool.transactions + 1),
                volume_b=Amount(pool.volume_b + amount_in)
            )
        pool = self.pools[pool_key]

        # Verify K invariant (should increase due to swap fees)
        k_after = Amount(pool.reserve_a * pool.reserve_b)
        self._check_k_not_decreased(k_before, k_after, "swap_tokens_for_exact_tokens")

        return SwapResult(
            action_in_amount,
            change_in,
            action_in.token_uid,
            amount_out,
            action_out.token_uid,
        )

    @public(allow_withdrawal=True, allow_deposit=True)
    def swap_exact_tokens_for_tokens_through_path(
        self, ctx: Context, path_str: str, deadline: Timestamp
    ) -> SwapResult:
        """Execute a swap with exact input amount through a specific path of pools.

        The input and output tokens and amounts are extracted from the transaction context.

        Args:
            ctx: The transaction context
            path_str: Comma-separated string of pool keys to traverse
            deadline: Block timestamp by which transaction must be included

        Returns:
            SwapResult with details of the swap

        Raises:
            PoolNotFound: If any pool in the path does not exist
            InsufficientLiquidity: If there is insufficient liquidity
            InvalidPath: If the path is invalid
            InvalidAction: If the actions are invalid or deadline has passed
        """
        if self.paused and ctx.caller_id != self.owner:
            raise InvalidState("Contract is paused")

        # Validate deadline
        if ctx.block.timestamp > deadline:
            raise InvalidAction(f"Transaction expired: block timestamp {ctx.block.timestamp} > deadline {deadline}")

        user_address = ctx.caller_id
        # Parse the path
        if not path_str:
            raise InvalidPath("Empty path")

        path = path_str.split(",")

        # Validate path length
        if len(path) == 0 or len(path) > 3:
            raise InvalidPath("Invalid path length")

        # Find deposit and withdrawal actions
        deposit_action = None
        withdrawal_action = None
        for action in ctx.actions.values():
            if isinstance(action[0], NCDepositAction):
                deposit_action = action[0]
            elif isinstance(action[0], NCWithdrawalAction):
                withdrawal_action = action[0]

        if not deposit_action or not withdrawal_action:
            raise InvalidAction("Missing deposit or withdrawal action")

        # Get the input amount and token from the deposit action
        amount_in = deposit_action.amount
        token_in = deposit_action.token_uid

        # Get the first pool to determine input token
        first_pool_key = path[0]
        if first_pool_key not in self.all_pools:
            raise PoolNotFound()

        # Execute the swap through the path
        current_amount = Amount(amount_in)
        current_token = token_in

        # Determine the output token of the first pool
        first_pool = self.pools[first_pool_key]
        if first_pool.token_a == current_token:
            next_token = first_pool.token_b
        elif first_pool.token_b == current_token:
            next_token = first_pool.token_a
        else:
            raise InvalidPath("First pool does not contain input token")

        # Execute the first swap
        first_amount_out = self._swap(
            ctx, current_amount, current_token, next_token, first_pool_key
        )

        # If there's only one hop, we're done
        if len(path) == 1:
            token_out = next_token
            amount_out = first_amount_out
        else:
            # Second hop
            current_amount = first_amount_out
            current_token = next_token
            second_pool_key = path[1]

            if second_pool_key not in self.all_pools:
                raise PoolNotFound()

            # Determine the output token of the second pool
            second_pool = self.pools[second_pool_key]
            if second_pool.token_a == current_token:
                next_token = second_pool.token_b
            elif second_pool.token_b == current_token:
                next_token = second_pool.token_a
            else:
                raise InvalidPath("Second pool does not contain intermediate token")

            # Execute the second swap
            second_amount_out = self._swap(
                ctx, current_amount, current_token, next_token, second_pool_key
            )

            # If there are only two hops, we're done
            if len(path) == 2:
                token_out = next_token
                amount_out = second_amount_out
            else:
                # Third hop
                current_amount = second_amount_out
                current_token = next_token
                third_pool_key = path[2]

                if third_pool_key not in self.all_pools:
                    raise PoolNotFound()

                # Determine the output token of the third pool
                third_pool = self.pools[third_pool_key]
                if third_pool.token_a == current_token:
                    next_token = third_pool.token_b
                elif third_pool.token_b == current_token:
                    next_token = third_pool.token_a
                else:
                    raise InvalidPath("Third pool does not contain intermediate token")

                # Execute the third swap
                third_amount_out = self._swap(
                    ctx, current_amount, current_token, next_token, third_pool_key
                )

                token_out = next_token
                amount_out = third_amount_out

        # Check if the output amount matches the withdrawal action
        if withdrawal_action.token_uid != token_out:
            raise InvalidAction("Withdrawal token does not match output token")

        # Calculate slippage (if the withdrawal amount is less than the calculated output)
        slippage_out = 0
        if withdrawal_action.amount < amount_out:
            slippage_out = Amount(amount_out - withdrawal_action.amount)
            # Add slippage to user balance for the output token in the last pool
            last_pool_key = path[-1]
            self._update_change(user_address, slippage_out, token_out, last_pool_key)
            amount_out = withdrawal_action.amount

        return SwapResult(
            Amount(amount_in),
            Amount(slippage_out),
            token_in,
            Amount(amount_out),
            token_out,
        )

    def _swap_exact_out(
        self,
        ctx: Context,
        amount_in: Amount,
        token_in: TokenUid,
        amount_out: Amount,
        token_out: TokenUid,
        pool_key: str,
    ) -> None:
        """Internal method to execute a swap in a single pool with exact output amount.

        This is a helper method for swap_tokens_for_exact_tokens_through_path.
        Unlike _swap, this method takes the exact output amount that should be produced.
        The input amount has already been calculated using get_amount_in.

        Args:
            ctx: The transaction context
            amount_in: The calculated amount of input tokens
            token_in: The input token
            amount_out: The exact amount of output tokens
            token_out: The output token
            pool_key: The pool key
        """
        # Get pool
        pool = self.pools[pool_key]

        # Get the pool reserves
        reserve_in = 0
        reserve_out = 0

        if pool.token_a == token_in:
            reserve_in = pool.reserve_a
            reserve_out = pool.reserve_b

            # Calculate fee amount for protocol fee
            fee = pool.fee_numerator
            fee_denominator = pool.fee_denominator
            fee_amount = (amount_in * fee + fee_denominator - 1) // fee_denominator

            # Calculate protocol fee with ceiling division only when it would round to zero
            protocol_fee_product = fee_amount * self.default_protocol_fee
            if protocol_fee_product > 0 and protocol_fee_product < 100:
                protocol_fee_amount = Amount(1)
            else:
                protocol_fee_amount = Amount(protocol_fee_product // 100)

            # Calculate liquidity increase for protocol fee
            liquidity_increase = self._get_protocol_liquidity_increase(
                protocol_fee_amount, token_in, pool_key
            )

            # Add liquidity to owner using the partial approach
            user_liquidity = self.pool_user_liquidity[pool_key]
            user_liquidity[self.owner] = Amount(
                user_liquidity.get(self.owner, 0) + liquidity_increase
            )
            self.pools[pool_key] = pool._replace(
                total_liquidity=Amount(pool.total_liquidity + liquidity_increase),
                reserve_a=Amount(reserve_in + amount_in),
                reserve_b=Amount(reserve_out - amount_out),
                volume_a=Amount(pool.volume_a + amount_in),
                volume_b=Amount(pool.volume_b + amount_out)
            )
            pool = self.pools[pool_key]
        else:
            reserve_in = pool.reserve_b
            reserve_out = pool.reserve_a

            # Calculate fee amount for protocol fee
            fee = pool.fee_numerator
            fee_denominator = pool.fee_denominator
            fee_amount = (amount_in * fee + fee_denominator - 1) // fee_denominator

            # Calculate protocol fee with ceiling division only when it would round to zero
            protocol_fee_product = fee_amount * self.default_protocol_fee
            if protocol_fee_product > 0 and protocol_fee_product < 100:
                protocol_fee_amount = Amount(1)
            else:
                protocol_fee_amount = Amount(protocol_fee_product // 100)

            # Calculate liquidity increase for protocol fee
            liquidity_increase = self._get_protocol_liquidity_increase(
                protocol_fee_amount, token_in, pool_key
            )

            # Add liquidity to owner and update reserves
            user_liquidity = self.pool_user_liquidity[pool_key]
            user_liquidity[self.owner] = Amount(
                user_liquidity.get(self.owner, 0) + liquidity_increase
            )
            self.pools[pool_key] = pool._replace(
                total_liquidity=Amount(pool.total_liquidity + liquidity_increase),
                reserve_b=Amount(reserve_in + amount_in),
                reserve_a=Amount(reserve_out - amount_out),
                volume_b=Amount(pool.volume_b + amount_in),
                volume_a=Amount(pool.volume_a + amount_out)
            )
            pool = self.pools[pool_key]

        # Update last activity timestamp and increment transaction count
        self.pools[pool_key] = pool._replace(
            last_activity=Timestamp(ctx.block.timestamp),
            transactions=Amount(pool.transactions + 1)
        )

    def _swap(
        self,
        ctx: Context,
        amount_in: Amount,
        token_in: TokenUid,
        token_out: TokenUid,
        pool_key: str,
    ) -> Amount:
        """Internal method to execute a swap in a single pool.

        This is a helper method for swap_exact_tokens_for_tokens_through_path.

        Args:
            ctx: The transaction context
            amount_in: The amount of input tokens
            token_in: The input token
            token_out: The output token
            pool_key: The pool key

        Returns:
            The amount of output tokens received
        """
        # Get pool
        pool = self.pools[pool_key]

        # Capture K before swap (should increase due to fees)
        k_before = Amount(pool.reserve_a * pool.reserve_b)

        # Get the pool reserves
        reserve_in = 0
        reserve_out = 0

        if pool.token_a == token_in:
            reserve_in = pool.reserve_a
            reserve_out = pool.reserve_b

            # Calculate the output amount
            fee = pool.fee_numerator
            fee_denominator = pool.fee_denominator
            a = fee_denominator - fee
            b = fee_denominator
            amount_out = (reserve_out * amount_in * a) // (
                reserve_in * b + amount_in * a
            )

            # Calculate fee amount for protocol fee
            fee_amount = (amount_in * fee + fee_denominator - 1) // fee_denominator

            # Calculate protocol fee with ceiling division only when it would round to zero
            protocol_fee_product = fee_amount * self.default_protocol_fee
            if protocol_fee_product > 0 and protocol_fee_product < 100:
                protocol_fee_amount = Amount(1)
            else:
                protocol_fee_amount = Amount(protocol_fee_product // 100)

            # Calculate liquidity increase for protocol fee
            liquidity_increase = self._get_protocol_liquidity_increase(
                protocol_fee_amount, token_in, pool_key
            )

            # Add liquidity to owner using the partial approach
            user_liquidity = self.pool_user_liquidity[pool_key]
            user_liquidity[self.owner] = Amount(
                user_liquidity.get(self.owner, 0) + liquidity_increase
            )
            self.pools[pool_key] = pool._replace(
                total_liquidity=Amount(pool.total_liquidity + liquidity_increase),
                reserve_a=Amount(reserve_in + amount_in),
                reserve_b=Amount(reserve_out - amount_out),
                volume_a=Amount(pool.volume_a + amount_in),
                volume_b=Amount(pool.volume_b + amount_out)
            )
            pool = self.pools[pool_key]
        else:
            reserve_in = pool.reserve_b
            reserve_out = pool.reserve_a

            # Calculate the output amount
            fee = pool.fee_numerator
            fee_denominator = pool.fee_denominator
            a = fee_denominator - fee
            b = fee_denominator
            amount_out = (reserve_out * amount_in * a) // (
                reserve_in * b + amount_in * a
            )

            # Calculate fee amount for protocol fee
            fee_amount = (amount_in * fee + fee_denominator - 1) // fee_denominator

            # Calculate protocol fee with ceiling division only when it would round to zero
            protocol_fee_product = fee_amount * self.default_protocol_fee
            if protocol_fee_product > 0 and protocol_fee_product < 100:
                protocol_fee_amount = Amount(1)
            else:
                protocol_fee_amount = Amount(protocol_fee_product // 100)

            # Calculate liquidity increase for protocol fee
            liquidity_increase = self._get_protocol_liquidity_increase(
                protocol_fee_amount, token_in, pool_key
            )

            # Add liquidity to owner and update reserves
            user_liquidity = self.pool_user_liquidity[pool_key]
            user_liquidity[self.owner] = Amount(
                user_liquidity.get(self.owner, 0) + liquidity_increase
            )
            self.pools[pool_key] = pool._replace(
                total_liquidity=Amount(pool.total_liquidity + liquidity_increase),
                reserve_b=Amount(reserve_in + amount_in),
                reserve_a=Amount(reserve_out - amount_out),
                volume_b=Amount(pool.volume_b + amount_in),
                volume_a=Amount(pool.volume_a + amount_out)
            )
            pool = self.pools[pool_key]

        # Update last activity timestamp and increment transaction count
        self.pools[pool_key] = pool._replace(
            last_activity=Timestamp(ctx.block.timestamp),
            transactions=Amount(pool.transactions + 1)
        )

        # Verify K invariant (should increase due to swap fees)
        pool_after = self.pools[pool_key]
        k_after = Amount(pool_after.reserve_a * pool_after.reserve_b)
        self._check_k_not_decreased(k_before, k_after, "_swap")

        return Amount(amount_out)

    @public(allow_withdrawal=True, allow_deposit=True)
    def swap_tokens_for_exact_tokens_through_path(
        self, ctx: Context, path_str: str, deadline: Timestamp
    ) -> SwapResult:
        """Execute a swap with exact output amount through a specific path of pools.

        The input and output tokens and amounts are extracted from the transaction context.

        Args:
            ctx: The transaction context
            path_str: Comma-separated string of pool keys to traverse
            deadline: Block timestamp by which transaction must be included

        Returns:
            SwapResult with details of the swap

        Raises:
            PoolNotFound: If any pool in the path does not exist
            InsufficientLiquidity: If there is insufficient liquidity
            InvalidPath: If the path is invalid
            InvalidAction: If the actions are invalid or deadline has passed
        """
        if self.paused and ctx.caller_id != self.owner:
            raise InvalidState("Contract is paused")

        # Validate deadline
        if ctx.block.timestamp > deadline:
            raise InvalidAction(f"Transaction expired: block timestamp {ctx.block.timestamp} > deadline {deadline}")

        user_address = ctx.caller_id
        # Parse the path
        if not path_str:
            raise InvalidPath("Empty path")

        path = path_str.split(",")

        # Validate path length
        if len(path) == 0 or len(path) > 3:
            raise InvalidPath("Invalid path length")

        # Find deposit and withdrawal actions
        deposit_action = None
        withdrawal_action = None
        for action in ctx.actions.values():
            if isinstance(action[0], NCDepositAction):
                deposit_action = action[0]
            elif isinstance(action[0], NCWithdrawalAction):
                withdrawal_action = action[0]

        if not deposit_action or not withdrawal_action:
            raise InvalidAction("Missing deposit or withdrawal action")

        # Get the output amount and token from the withdrawal action
        amount_out = withdrawal_action.amount
        token_out = withdrawal_action.token_uid

        # Get the actual input amount from deposit action
        actual_amount_in = deposit_action.amount
        token_in = deposit_action.token_uid

        # For a single hop path
        if len(path) == 1:
            pool_key = path[0]
            if pool_key not in self.all_pools:
                raise PoolNotFound()

            pool = self.pools[pool_key]

            # Verify the tokens match the pool
            if (
                token_out != pool.token_a
                and token_out != pool.token_b
            ):
                raise InvalidPath("Pool does not contain output token")
            if (
                token_in != pool.token_a
                and token_in != pool.token_b
            ):
                raise InvalidPath("Pool does not contain input token")

            # Calculate the required input amount
            reserve_in = 0
            reserve_out = 0
            if pool.token_a == token_in:
                reserve_in = pool.reserve_a
                reserve_out = pool.reserve_b
            else:
                reserve_in = pool.reserve_b
                reserve_out = pool.reserve_a

            # Validate sufficient liquidity
            if amount_out >= reserve_out:
                raise InsufficientLiquidity("Insufficient funds")

            # Get the fee for this pool
            fee = pool.fee_numerator
            fee_denominator = pool.fee_denominator

            # Calculate the required input amount
            amount_in = self.get_amount_in(
                amount_out, reserve_in, reserve_out, fee, fee_denominator
            )

            # Check if the provided amount is sufficient
            if actual_amount_in < amount_in:
                raise InvalidAction("Amount in is too low")

            # Calculate slippage
            change_in = actual_amount_in - amount_in

            # Update user balance for slippage
            if change_in > 0:
                self._update_change(user_address, change_in, token_in, pool_key)

            # Execute the swap (updates reserves and statistics)
            self._swap_exact_out(
                ctx,
                Amount(amount_in),
                token_in,
                Amount(amount_out),
                token_out,
                pool_key,
            )

            return SwapResult(
                Amount(actual_amount_in),
                change_in,
                token_in,
                Amount(amount_out),
                token_out,
            )

        # For multi-hop paths, we need to calculate backwards
        # This implementation handles 2 or 3 hops

        # Get the last pool
        last_pool_key = path[-1]
        if last_pool_key not in self.all_pools:
            raise PoolNotFound()

        # Verify the output token is in the last pool
        last_pool = self.pools[last_pool_key]
        if (
            token_out != last_pool.token_a
            and token_out != last_pool.token_b
        ):
            raise InvalidPath("Last pool does not contain output token")

        # For 2-hop path: token_in -> intermediate -> token_out
        if len(path) == 2:
            # Get the second pool (intermediate -> token_out)
            second_pool_key = path[1]
            second_pool = self.pools[second_pool_key]

            # Determine the intermediate token
            if second_pool.token_a == token_out:
                intermediate_token = second_pool.token_b
            else:
                intermediate_token = second_pool.token_a

            # Get the first pool (token_in -> intermediate)
            first_pool_key = path[0]
            if first_pool_key not in self.all_pools:
                raise PoolNotFound()

            first_pool = self.pools[first_pool_key]

            # Verify the input token is in the first pool
            if (
                token_in != first_pool.token_a
                and token_in != first_pool.token_b
            ):
                raise InvalidPath("First pool does not contain input token")

            # Verify the intermediate token connects the pools
            if (
                intermediate_token != first_pool.token_a
                and intermediate_token != first_pool.token_b
            ):
                raise InvalidPath("First pool does not contain intermediate token")

            # Calculate backwards from the output
            # First, calculate how much intermediate token we need
            second_reserve_in = 0
            second_reserve_out = 0
            if second_pool.token_a == intermediate_token:
                second_reserve_in = second_pool.reserve_a
                second_reserve_out = second_pool.reserve_b
            else:
                second_reserve_in = second_pool.reserve_b
                second_reserve_out = second_pool.reserve_a

            # Validate sufficient liquidity for second hop
            if amount_out >= second_reserve_out:
                raise InsufficientLiquidity("Insufficient funds in second pool")

            second_fee = second_pool.fee_numerator
            second_fee_denominator = second_pool.fee_denominator

            intermediate_amount = self.get_amount_in(
                amount_out,
                second_reserve_in,
                second_reserve_out,
                second_fee,
                second_fee_denominator,
            )

            # Then, calculate how much input token we need
            first_reserve_in = 0
            first_reserve_out = 0
            if first_pool.token_a == token_in:
                first_reserve_in = first_pool.reserve_a
                first_reserve_out = first_pool.reserve_b
            else:
                first_reserve_in = first_pool.reserve_b
                first_reserve_out = first_pool.reserve_a

            # Validate sufficient liquidity for first hop
            if intermediate_amount >= first_reserve_out:
                raise InsufficientLiquidity("Insufficient funds in first pool")

            first_fee = first_pool.fee_numerator
            first_fee_denominator = first_pool.fee_denominator

            amount_in = self.get_amount_in(
                intermediate_amount,
                first_reserve_in,
                first_reserve_out,
                first_fee,
                first_fee_denominator,
            )

            # Check if the provided amount is sufficient
            if actual_amount_in < amount_in:
                raise InvalidAction("Amount in is too low")

            # Calculate slippage
            change_in = actual_amount_in - amount_in

            # Update user balance for slippage
            if change_in > 0:
                self._update_change(
                    user_address, change_in, token_in, first_pool_key
                )

            # Execute the swaps
            # First swap: token_in -> intermediate
            # For the first swap, we need the exact intermediate amount that will be needed for the second swap
            self._swap_exact_out(
                ctx,
                amount_in,
                token_in,
                intermediate_amount,
                intermediate_token,
                first_pool_key,
            )

            # Second swap: intermediate -> token_out
            self._swap_exact_out(
                ctx,
                intermediate_amount,
                intermediate_token,
                Amount(amount_out),
                token_out,
                second_pool_key,
            )

            return SwapResult(
                Amount(actual_amount_in),
                change_in,
                token_in,
                Amount(amount_out),
                token_out,
            )

        # For 3-hop path: token_in -> first_intermediate -> second_intermediate -> token_out
        if len(path) == 3:
            # Get the third pool (last in the path)
            third_pool_key = path[2]
            if third_pool_key not in self.all_pools:
                raise PoolNotFound()

            # Get third pool and determine the output token and the second intermediate token
            third_pool = self.pools[third_pool_key]
            if third_pool.token_a == token_out:
                second_intermediate_token = third_pool.token_b
            elif third_pool.token_b == token_out:
                second_intermediate_token = third_pool.token_a
            else:
                raise InvalidPath("Third pool does not contain output token")

            # Get the second pool (middle of the path)
            second_pool_key = path[1]
            if second_pool_key not in self.all_pools:
                raise PoolNotFound()

            second_pool = self.pools[second_pool_key]
            # Determine the first intermediate token
            if second_pool.token_a == second_intermediate_token:
                first_intermediate_token = second_pool.token_b
            elif second_pool.token_b == second_intermediate_token:
                first_intermediate_token = second_pool.token_a
            else:
                raise InvalidPath("Second pool does not connect to third pool")

            # Get the first pool (first in the path)
            first_pool_key = path[0]
            if first_pool_key not in self.all_pools:
                raise PoolNotFound()

            first_pool = self.pools[first_pool_key]
            # Verify the input token is in the first pool
            if (
                token_in != first_pool.token_a
                and token_in != first_pool.token_b
            ):
                raise InvalidPath("First pool does not contain input token")

            # Verify the first intermediate token connects the first and second pools
            if (
                first_intermediate_token != first_pool.token_a
                and first_intermediate_token != first_pool.token_b
            ):
                raise InvalidPath("First pool does not connect to second pool")

            # Calculate backwards from the output
            # First, calculate how much second_intermediate_token we need
            third_reserve_in = 0
            third_reserve_out = 0
            if third_pool.token_a == second_intermediate_token:
                third_reserve_in = third_pool.reserve_a
                third_reserve_out = third_pool.reserve_b
            else:
                third_reserve_in = third_pool.reserve_b
                third_reserve_out = third_pool.reserve_a

            # Validate sufficient liquidity for third hop
            if amount_out >= third_reserve_out:
                raise InsufficientLiquidity("Insufficient funds in third pool")

            third_fee = third_pool.fee_numerator
            third_fee_denominator = third_pool.fee_denominator

            second_intermediate_amount = self.get_amount_in(
                amount_out,
                third_reserve_in,
                third_reserve_out,
                third_fee,
                third_fee_denominator,
            )

            # Then, calculate how much first_intermediate_token we need
            second_reserve_in = 0
            second_reserve_out = 0
            if second_pool.token_a == first_intermediate_token:
                second_reserve_in = second_pool.reserve_a
                second_reserve_out = second_pool.reserve_b
            else:
                second_reserve_in = second_pool.reserve_b
                second_reserve_out = second_pool.reserve_a

            # Validate sufficient liquidity for second hop
            if second_intermediate_amount >= second_reserve_out:
                raise InsufficientLiquidity("Insufficient funds in second pool")

            second_fee = second_pool.fee_numerator
            second_fee_denominator = second_pool.fee_denominator

            first_intermediate_amount = self.get_amount_in(
                second_intermediate_amount,
                second_reserve_in,
                second_reserve_out,
                second_fee,
                second_fee_denominator,
            )

            # Finally, calculate how much input token we need
            first_reserve_in = 0
            first_reserve_out = 0
            if first_pool.token_a == token_in:
                first_reserve_in = first_pool.reserve_a
                first_reserve_out = first_pool.reserve_b
            else:
                first_reserve_in = first_pool.reserve_b
                first_reserve_out = first_pool.reserve_a

            # Validate sufficient liquidity for first hop
            if first_intermediate_amount >= first_reserve_out:
                raise InsufficientLiquidity("Insufficient funds in first pool")

            first_fee = first_pool.fee_numerator
            first_fee_denominator = first_pool.fee_denominator

            amount_in = self.get_amount_in(
                first_intermediate_amount,
                first_reserve_in,
                first_reserve_out,
                first_fee,
                first_fee_denominator,
            )

            
            # Check if the provided amount is sufficient
            if actual_amount_in < amount_in:
                raise InvalidAction("Amount in is too low")

            # Calculate slippage
            change_in = actual_amount_in - amount_in

            # Update user balance for slippage
            if change_in > 0:
                self._update_change(
                    user_address, change_in, token_in, first_pool_key
                )

            # Execute the swaps
            # First swap: token_in -> first_intermediate_token
            self._swap_exact_out(
                ctx,
                amount_in,
                token_in,
                first_intermediate_amount,
                first_intermediate_token,
                first_pool_key,
            )

            # Second swap: first_intermediate_token -> second_intermediate_token
            self._swap_exact_out(
                ctx,
                first_intermediate_amount,
                first_intermediate_token,
                second_intermediate_amount,
                second_intermediate_token,
                second_pool_key,
            )

            # Third swap: second_intermediate_token -> token_out
            self._swap_exact_out(
                ctx,
                second_intermediate_amount,
                second_intermediate_token,
                Amount(amount_out),
                token_out,
                third_pool_key,
            )

            return SwapResult(
                Amount(actual_amount_in),
                change_in,
                token_in,
                Amount(amount_out),
                token_out,
            )

        # This should never happen due to the path length validation above
        raise InvalidPath("Invalid path length")

    @public(allow_withdrawal=True)
    def withdraw_cashback(
        self,
        ctx: Context,
        fee: Amount,
    ) -> None:
        """Withdraw cashback from a pool.

        Args:
            ctx: The transaction context
            token_a: First token of the pair
            token_b: Second token of the pair
            fee: Fee for the pool

        Raises:
            PoolNotFound: If the pool does not exist
            InvalidAction: If there is not enough cashback
        """
        if self.paused and ctx.caller_id != self.owner:
            raise InvalidState("Contract is paused")

        token_a, token_b = set(ctx.actions.keys())
        user_address = ctx.caller_id

        # Ensure tokens are ordered
        if token_a > token_b:
            token_a, token_b = token_b, token_a

        pool_key = self._get_pool_key(token_a, token_b, fee)
        self._validate_pool_exists(pool_key)

        pool = self.pools[pool_key]

        action_a, action_b = self._get_actions_out_out(ctx, pool_key)

        action_a_amount = Amount(action_a.amount)
        action_b_amount = Amount(action_b.amount)

        # Check if user has enough cashback (using consolidated balance)
        current_balance_a, current_balance_b = self.pool_change[pool_key].get(
            user_address, (Amount(0), Amount(0))
        )

        if action_a_amount > current_balance_a:
            raise InvalidAction("Not enough cashback for token A")

        if action_b_amount > current_balance_b:
            raise InvalidAction("Not enough cashback for token B")

        # Update user balances (consolidated tuple)
        new_balance_a = Amount(current_balance_a - action_a_amount)
        new_balance_b = Amount(current_balance_b - action_b_amount)
        self.pool_change[pool_key][user_address] = (new_balance_a, new_balance_b)

        # Update total balances
        new_total_change_a = Amount(pool.total_change_a - action_a_amount)
        new_total_change_b = Amount(pool.total_change_b - action_b_amount)

        # Update pool state with new values
        pool = pool._replace(
            total_change_a=new_total_change_a,
            total_change_b=new_total_change_b,
        )
        self.pools[pool_key] = pool


    @public
    def change_protocol_fee(self, ctx: Context, new_fee: Amount) -> None:
        """Change the protocol fee.

        Args:
            ctx: The transaction context
            new_fee: The new protocol fee

        Raises:
            Unauthorized: If the caller is not the owner
            InvalidFee: If the fee is invalid
        """
        if ctx.caller_id != self.owner:
            raise Unauthorized("Only the owner can change the protocol fee")

        # Validate fee is in valid range [0, 50]
        if new_fee < 0:
            raise InvalidFee("Protocol fee must be >= 0")

        if new_fee > 50:
            raise InvalidFee("Protocol fee must be <= 50%")

        self.default_protocol_fee = new_fee

    @public
    def add_authorized_signer(self, ctx: Context, signer_address: Address) -> None:
        """Add an address to the list of authorized signers.

        Only the contract owner can add authorized signers.
        Authorized signers can sign pools for listing in the Dozer dApp.

        Args:
            ctx: The transaction context
            signer_address: The address to authorize as a signer

        Raises:
            Unauthorized: If the caller is not the owner
        """
        if ctx.caller_id != self.owner:
            raise Unauthorized("Only the owner can add authorized signers")

        self.authorized_signers.add(signer_address)

    @public
    def remove_authorized_signer(self, ctx: Context, signer_address: Address) -> None:
        """Remove an address from the list of authorized signers.

        Only the contract owner can remove authorized signers.
        The owner cannot be removed as an authorized signer.

        Args:
            ctx: The transaction context
            signer_address: The address to remove authorization from

        Raises:
            Unauthorized: If the caller is not the owner
            NCFail: If trying to remove the owner as a signer
        """
        if ctx.caller_id != self.owner:
            raise Unauthorized("Only the owner can remove authorized signers")

        if signer_address == self.owner:
            raise NCFail("Cannot remove the owner as an authorized signer")

        self.authorized_signers.discard(signer_address)

    @public
    def sign_pool(
        self, ctx: Context, token_a: TokenUid, token_b: TokenUid, fee: Amount
    ) -> None:
        """Sign a pool for listing in the Dozer dApp.

        Only authorized signers can sign pools.
        Signed pools are eligible for listing in the Dozer dApp.

        Args:
            ctx: The transaction context
            token_a: First token of the pair
            token_b: Second token of the pair
            fee: Fee for the pool

        Raises:
            Unauthorized: If the caller is not an authorized signer
            PoolNotFound: If the pool does not exist
        """
        if ctx.caller_id not in self.authorized_signers:
            raise Unauthorized("Only authorized signers can sign pools")

        # Ensure tokens are ordered
        if token_a > token_b:
            token_a, token_b = token_b, token_a

        pool_key = self._get_pool_key(token_a, token_b, fee)
        self._validate_pool_exists(pool_key)

        self.pool_signers[pool_key] = ctx.caller_id

    @public
    def unsign_pool(
        self, ctx: Context, token_a: TokenUid, token_b: TokenUid, fee: Amount
    ) -> None:
        """Remove a pool's signature for listing in the Dozer dApp.

        Only the owner or the original signer can unsign a pool.

        Args:
            ctx: The transaction context
            token_a: First token of the pair
            token_b: Second token of the pair
            fee: Fee for the pool

        Raises:
            Unauthorized: If the caller is not the owner or original signer
            PoolNotFound: If the pool does not exist
        """
        # Ensure tokens are ordered
        if token_a > token_b:
            token_a, token_b = token_b, token_a

        pool_key = self._get_pool_key(token_a, token_b, fee)
        self._validate_pool_exists(pool_key)

        if not pool_key in self.pool_signers:
            # Pool is not signed, nothing to do
            return

        original_signer = self.pool_signers.get(pool_key)
        if ctx.caller_id != self.owner and ctx.caller_id != original_signer:
            raise Unauthorized("Only the owner or original signer can unsign a pool")

        if pool_key in self.pool_signers:
            del self.pool_signers[pool_key]

    @public
    def set_htr_usd_pool(
        self, ctx: Context, token_a: TokenUid, token_b: TokenUid, fee: Amount
    ) -> None:
        """Set the HTR-USD pool for price calculations.

        Only the owner can set the HTR-USD pool.
        The pool must exist and contain HTR as one of the tokens.

        Args:
            ctx: The transaction context
            token_a: First token of the pair
            token_b: Second token of the pair
            fee: Fee for the pool

        Raises:
            Unauthorized: If the caller is not the owner
            PoolNotFound: If the pool does not exist
            InvalidTokens: If neither token is HTR
        """
        if ctx.caller_id != self.owner:
            raise Unauthorized("Only the owner can set the HTR-USD pool")

        # Ensure tokens are ordered
        if token_a > token_b:
            token_a, token_b = token_b, token_a

        pool_key = self._get_pool_key(token_a, token_b, fee)
        self._validate_pool_exists(pool_key)

        # Verify that one of the tokens is HTR
        if token_a != HATHOR_TOKEN_UID and token_b != HATHOR_TOKEN_UID:
            raise InvalidTokens("HTR-USD pool must contain HTR as one of the tokens")

        self.htr_usd_pool_key = pool_key

    @public
    def pause(self, ctx: Context) -> None:
        """Emergency pause functionality.

        Only the owner can pause the contract.
        When paused, all trading and liquidity operations are blocked for non-owners.

        Args:
            ctx: The transaction context

        Raises:
            Unauthorized: If the caller is not the owner
        """
        if ctx.caller_id != self.owner:
            raise Unauthorized("Only owner can pause")
        self.paused = True

    @public
    def unpause(self, ctx: Context) -> None:
        """Unpause functionality.

        Only the owner can unpause the contract.

        Args:
            ctx: The transaction context

        Raises:
            Unauthorized: If the caller is not the owner
        """
        if ctx.caller_id != self.owner:
            raise Unauthorized("Only owner can unpause")
        self.paused = False

    @view
    def is_paused(self) -> bool:
        """Check if the contract is currently paused.

        Returns:
            True if the contract is paused, False otherwise
        """
        return self.paused

    @view
    def get_signed_pools(self) -> list[str]:
        """Get a list of all signed pools.

        Returns:
            A list of pool keys that are signed for listing in the Dozer dApp
        """
        result = []
        for pool_key in self.all_pools:
            if pool_key not in self.pool_signers:
                continue
            pool = self.pools[pool_key]
            token_a = pool.token_a.hex()
            token_b = pool.token_b.hex()
            fee = pool.fee_numerator
            result.append(f"{token_a}/{token_b}/{fee}")
        return result

    @view
    def is_authorized_signer(self, address: Address) -> bool:
        """Check if an address is an authorized signer.

        Args:
            address: The address to check

        Returns:
            True if the address is an authorized signer, False otherwise
        """
        return address in self.authorized_signers

    @view
    def get_htr_usd_pool(self) -> str | None:
        """Get the current HTR-USD pool key.

        Returns:
            The pool key of the HTR-USD pool, or None if not set
        """
        return self.htr_usd_pool_key

    @view
    def get_user_pools(self, address: CallerId) -> list[str]:
        """Get all pools where a user has liquidity.

        Args:
            address: The address to check

        Returns:
            A list of pool keys where the user has liquidity
        """
        user_pools = []
        for pool_key in self.all_pools:
            user_liquidity = self.pool_user_liquidity[pool_key].get(address, 0)
            if user_liquidity > 0:
                user_pools.append(pool_key)
        return user_pools

    @view
    def get_user_positions(self, address: CallerId) -> dict[str, UserPosition]:
        """Get detailed information about all user positions across pools.

        Args:
            address: The address to check

        Returns:
            A dictionary mapping pool keys to UserPosition information
        """
        positions = {}
        for pool_key in self.all_pools:
            user_liquidity = self.pool_user_liquidity[pool_key].get(address, 0)
            if user_liquidity > 0:
                # Get detailed information about this position
                user_info = self.user_info(address, pool_key)

                # Create UserPosition with additional fee information
                positions[pool_key] = UserPosition(
                    liquidity=user_info.liquidity,
                    token0Amount=user_info.token0Amount,
                    token1Amount=user_info.token1Amount,
                    share=user_info.share,
                    balance_a=user_info.balance_a,
                    balance_b=user_info.balance_b,
                    token_a=user_info.token_a,
                    token_b=user_info.token_b,
                )
        return positions

    @view
    def get_token_price_in_htr(self, token: TokenUid) -> Amount:
        """Get the price of a token in HTR based on USD price and HTR-USD rate.

        Args:
            token: The token to get the price for

        Returns:
            The price of the token in HTR with 8 decimal places, or 0 if not available
        """
        # HTR itself has a price of 1 in HTR
        if token == HATHOR_TOKEN_UID:
            return Amount(100_000000)  # 1 with 8 decimal places

        # Get token price in USD
        token_usd_price = self.get_token_price_in_usd(token)
        if token_usd_price == 0:
            return Amount(0)
        
        # Get HTR price in USD
        htr_usd_price = self.get_token_price_in_usd(HATHOR_TOKEN_UID)
        if htr_usd_price == 0:
            return Amount(0)
        
        # Calculate HTR price: token_htr_price = token_usd_price / htr_usd_price
        # Both prices have 8 decimal places, so: (token_usd_price * 100_000000) / htr_usd_price
        return Amount((token_usd_price * 100_000000) // htr_usd_price)

    @view
    def get_all_token_prices_in_htr(self) -> dict[str, Amount]:
        """Get the prices of all tokens in HTR based on USD prices and HTR-USD rate.

        Returns:
            A dictionary mapping token UIDs (hex) to their prices in HTR with 8 decimal places
        """
        result = {}
        result[HATHOR_TOKEN_UID.hex()] = Amount(100_000000)  # HTR itself has a price of 1 in HTR
        
        # Get all unique tokens from all pools
        unique_tokens = set()
        for pool_key in self.all_pools:
            pool = self.pools[pool_key]
            token_a = pool.token_a
            token_b = pool.token_b
            unique_tokens.add(token_a)
            unique_tokens.add(token_b)
        
        # Calculate price for each token (except HTR)
        for token in unique_tokens:
            if token != HATHOR_TOKEN_UID:
                price = self.get_token_price_in_htr(token)
                if price > 0:
                    result[token.hex()] = Amount(price)

        return result

    @view
    def get_token_price_in_usd(self, token: TokenUid) -> Amount:
        """Get the price of a token in USD using reserve ratio method.

        Args:
            token: The token to get the price for

        Returns:
            The price of the token in USD with 8 decimal places, or 0 if not available
        """
        # First, check if we have a HTR-USD pool set
        if not self.htr_usd_pool_key:
            return Amount(0)
        
        # Get the USD token from the HTR-USD pool
        pool_key = self.htr_usd_pool_key
        pool = self.pools[pool_key]
        if pool.token_a == HATHOR_TOKEN_UID:
            usd_token = pool.token_b
        else:
            usd_token = pool.token_a
        
        # USD token price is always 1.00
        if token == usd_token:
            return Amount(100_000000)  # 8 decimal places to match contract storage
        
        # Find the best path from USD to target token using pathfinding
        # This gives us the path USD → TOKEN_A (but we'll calculate in reverse)
        ref_amount = Amount(100_00)  # Reference amount to get the path
        swap_info = self.find_best_swap_path(ref_amount, usd_token, token, 3)
        
        if not swap_info.path or swap_info.amount_out == 0:
            return Amount(0)
        
        # Parse the path to get pool keys
        pool_keys = swap_info.path.split(",")
        
        # Calculate cumulative price using reserve ratios with integer precision
        # We want TOKEN_A price in USD, so we calculate in reverse direction
        # Start with 1
        final_price = 1_00000000  # 1 with 8 decimal places
        current_token = token  # Start from TOKEN_A
        
        # Iterate through pools in reverse order (TOKEN_A → USD direction)
        for i, pool_key_iter in enumerate(reversed(pool_keys)):
            pool_iter = self.pools[pool_key_iter]
            # Determine which token is the input and output for this hop
            if pool_iter.token_a == current_token:
                reserve_in = pool_iter.reserve_a
                reserve_out = pool_iter.reserve_b
                next_token = pool_iter.token_b
            elif pool_iter.token_b == current_token:
                reserve_in = pool_iter.reserve_b
                reserve_out = pool_iter.reserve_a
                next_token = pool_iter.token_a
            else:
                # Invalid path - token not found in pool
                return Amount(0)
            
            # Check for zero reserves (avoid division by zero)
            if reserve_in == 0:
                return Amount(0)
            
            # Calculate spot price for this hop: reserve_out / reserve_in
            # This gives us "how much of next_token per current_token"
            # hop_price = reserve_out / reserve_in
            final_price = (final_price * reserve_out) // reserve_in
            
            # Move to next token in the path
            current_token = next_token
        
        result = Amount(final_price)
        return result

    @view
    def get_all_token_prices_in_usd(self) -> dict[str, Amount]:
        """Get the prices of all tokens in USD using reserve ratio method.

        Returns:
            A dictionary mapping token UIDs (hex) to their prices in USD with 8 decimal places
        """
        # First, check if we have a HTR-USD pool set
        if not self.htr_usd_pool_key:
            return {}
        
        result = {}
        
        # Get the USD token from the HTR-USD pool
        pool_key = self.htr_usd_pool_key
        pool = self.pools[pool_key]
        if pool.token_a == HATHOR_TOKEN_UID:
            usd_token = pool.token_b
        else:
            usd_token = pool.token_a
        
        # Get all unique tokens from all pools
        unique_tokens = set()
        for pool_key_iter in self.all_pools:
            pool_iter = self.pools[pool_key_iter]
            token_a = pool_iter.token_a
            token_b = pool_iter.token_b
            unique_tokens.add(token_a)
            unique_tokens.add(token_b)
        
        # Calculate USD price for each token
        for token in unique_tokens:
            # USD token is always 1.00 (100_000000 with 8 decimal places)
            if token == usd_token:
                result[token.hex()] = Amount(100_000000)
            else:
                price = self.get_token_price_in_usd(token)
                if price > 0:
                    result[token.hex()] = Amount(price)

        return result

    @public
    def change_owner(self, ctx: Context, new_owner: Address) -> None:
        """Change the owner of the contract.

        Args:
            ctx: The transaction context
            new_owner: The new owner address

        Raises:
            Unauthorized: If the caller is not the owner
        """
        if ctx.caller_id != self.owner:
            raise Unauthorized("Only owner can change owner")

        self.owner = new_owner

    @public
    def upgrade_contract(self, ctx: Context, new_blueprint_id: BlueprintId, new_version: str) -> None:
        """Upgrade the contract to a new blueprint version.

        Args:
            ctx: Transaction context
            new_blueprint_id: The blueprint ID to upgrade to
            new_version: Version string for the new blueprint (e.g., "1.1.0")

        Raises:
            Unauthorized: If caller is not the owner
            InvalidVersion: If new version is not higher than current version
        """
        # Only owner can upgrade
        if ctx.caller_id != self.owner:
            raise Unauthorized("Only owner can upgrade contract")

        # Validate version is newer
        if not self._is_version_higher(new_version, self.contract_version):
            raise InvalidVersion(f"New version {new_version} must be higher than current {self.contract_version}")
        self.contract_version = new_version
        
        # Perform the upgrade
        self.syscall.change_blueprint(new_blueprint_id)

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


    @view
    def get_reserves(
        self,
        token_a: TokenUid,
        token_b: TokenUid,
        fee: Amount,
    ) -> tuple[Amount, Amount]:
        """Get the reserves for a specific pool.

        Args:
            token_a: First token of the pair
            token_b: Second token of the pair
            fee: Fee for the pool

        Returns:
            A tuple of (reserve_a, reserve_b)

        Raises:
            PoolNotFound: If the pool does not exist
        """
        # Ensure tokens are ordered
        if token_a > token_b:
            token_a, token_b = token_b, token_a

        pool_key = self._get_pool_key(token_a, token_b, fee)
        self._validate_pool_exists(pool_key)
        pool = self.pools[pool_key]

        return (pool.reserve_a, pool.reserve_b)

    @view
    def get_all_pools(self) -> list[str]:
        """Get a list of all pools with their tokens and fees.

        Returns:
            A list of tuples (token_a, token_b, fee)
        """
        result = []
        for pool_key in self.all_pools:
            pool = self.pools[pool_key]
            token_a = pool.token_a.hex()
            token_b = pool.token_b.hex()
            fee = pool.fee_numerator
            result.append(f"{token_a}/{token_b}/{fee}")
        return result

    @view
    def get_pools_for_token(self, token: TokenUid) -> list[str]:
        """Get all pools that contain a specific token.

        Args:
            token: The token to search for

        Returns:
            A list of tuples (token_a, token_b, fee)
        """
        if token not in self.token_to_pools:
            return []

        result = []
        for pool_key in self.token_to_pools[token]:
            pool = self.pools[pool_key]
            token_a = pool.token_a.hex()
            token_b = pool.token_b.hex()
            fee = pool.fee_numerator
            result.append(f"{token_a}/{token_b}/{fee}")
        return result

    @view
    def liquidity_of(
        self,
        address: CallerId,
        pool_key: str,
    ) -> Amount:
        """Get the liquidity of an address in a specific pool.

        Args:
            address: The address to check
            token_a: First token of the pair
            token_b: Second token of the pair
            fee: Fee for the pool

        Returns:
            The liquidity amount

        Raises:
            PoolNotFound: If the pool does not exist
        """
        self._validate_pool_exists(pool_key)

        return Amount(self.pool_user_liquidity[pool_key].get(address, 0))

    @view
    def change_of(
        self,
        address: CallerId,
        pool_key: str,
    ) -> tuple[Amount, Amount]:
        """Get the change (excess tokens from good slippage) of an address in a specific pool.

        Args:
            address: The address to check
            pool_key: The pool key to check

        Returns:
            A tuple of (change_a, change_b)

        Raises:
            PoolNotFound: If the pool does not exist
        """
        self._validate_pool_exists(pool_key)

        change_a, change_b = self.pool_change[pool_key].get(address, (Amount(0), Amount(0)))

        return (change_a, change_b)

    @view
    def front_end_api_pool(
        self,
        pool_key: str,
    ) -> PoolApiInfo:
        """Get pool information for frontend display.

        Args:
            pool_key: The pool key to check

        Returns:
            A PoolApiInfo NamedTuple with pool information

        Raises:
            PoolNotFound: If the pool does not exist
        """

        token_a, token_b, fee = pool_key.split("/")
        token_a = TokenUid(bytes.fromhex(token_a))
        token_b = TokenUid(bytes.fromhex(token_b))
        fee = Amount(int(fee))
        # Ensure tokens are ordered
        if token_a > token_b:
            token_a, token_b = token_b, token_a

        pool_key = self._get_pool_key(token_a, token_b, fee)
        self._validate_pool_exists(pool_key)

        pool = self.pools[pool_key]

        is_signed = pool_key in self.pool_signers
        signer_address = self.pool_signers.get(pool_key, None)
        signer_str = (
            signer_address.hex()
            if signer_address is not None
            else None
        )

        return PoolApiInfo(
            reserve0=Amount(pool.reserve_a),
            reserve1=Amount(pool.reserve_b),
            fee=Amount(pool.fee_numerator),
            volume=Amount(pool.volume_a),
            fee0=Amount(self.pool_accumulated_fee[pool_key].get(token_a, 0)),
            fee1=Amount(self.pool_accumulated_fee[pool_key].get(token_b, 0)),
            dzr_rewards=Amount(1000),
            transactions=Amount(pool.transactions),
            is_signed=Amount(1 if is_signed else 0),
            signer=signer_str,
        )


    @view
    def pool_info(
        self,
        pool_key: str,
    ) -> PoolInfo:
        """Get detailed information about a pool.

        Args:
            pool_key: The pool key to check

        Returns:
            A PoolInfo NamedTuple with pool information

        Raises:
            PoolNotFound: If the pool does not exist
        """
        self._validate_pool_exists(pool_key)
        pool = self.pools[pool_key]

        is_signed = pool_key in self.pool_signers
        signer_address = self.pool_signers.get(pool_key, None)
        signer_str = (
            signer_address.hex()
            if signer_address is not None
            else None
        )

        return PoolInfo(
            token_a=pool.token_a.hex(),
            token_b=pool.token_b.hex(),
            reserve_a=pool.reserve_a,
            reserve_b=pool.reserve_b,
            fee=pool.fee_numerator,
            total_liquidity=pool.total_liquidity,
            transactions=pool.transactions,
            volume_a=pool.volume_a,
            volume_b=pool.volume_b,
            last_activity=pool.last_activity,
            is_signed=is_signed,
            signer=signer_str,
        )


    @view
    def user_info(
        self,
        address: CallerId,
        pool_key: str,
    ) -> UserInfo:
        """Get detailed information about a user's position in a pool.

        Args:
            address: The address to check
            pool_key: The pool key to check

        Returns:
            A UserInfo NamedTuple with user information

        Raises:
            PoolNotFound: If the pool does not exist
        """
        self._validate_pool_exists(pool_key)
        pool = self.pools[pool_key]

        # Get user-specific data
        liquidity = self.pool_user_liquidity[pool_key].get(address, 0)
        balance_a, balance_b = self.pool_change[pool_key].get(address, (Amount(0), Amount(0)))

        # Calculate share
        share = 0
        total_liquidity = pool.total_liquidity
        if total_liquidity > 0:
            share = liquidity * 100 // total_liquidity

        # Calculate token amounts based on share
        reserve_a = pool.reserve_a
        reserve_b = pool.reserve_b
        token_a_amount = 0
        token_b_amount = 0
        if total_liquidity > 0:
            token_a_amount = reserve_a * liquidity // total_liquidity
            token_b_amount = reserve_b * liquidity // total_liquidity

        return UserInfo(
            liquidity=Amount(liquidity),
            token0Amount=Amount(token_a_amount),
            token1Amount=Amount(token_b_amount),
            share=Amount(share),
            balance_a=Amount(balance_a),
            balance_b=Amount(balance_b),
            token_a=pool.token_a.hex(),
            token_b=pool.token_b.hex(),
        )

    @view
    def get_user_profit_info(
        self,
        address: CallerId,
        pool_key: str,
    ) -> UserProfitInfo:
        """Get profit/loss information for a user's position in a pool.

        Args:
            address: The address to check
            pool_key: The pool key to check

        Returns:
            A UserProfitInfo NamedTuple with profit information

        Raises:
            PoolNotFound: If the pool does not exist
        """
        self._validate_pool_exists(pool_key)

        # Check if user has liquidity in this pool
        user_liquidity = self.pool_user_liquidity[pool_key].get(address, 0)
        if user_liquidity == 0:
            return UserProfitInfo(
                current_value_usd=Amount(0),
                initial_value_usd=Amount(0),
                profit_amount_usd=Amount(0),
                profit_percentage=Amount(0),
                last_action_timestamp=0,
            )

        # Get current USD value of position
        current_value_usd = self._calculate_user_position_usd_value(address, pool_key)

        # Get stored initial USD value
        initial_value_usd = self.pool_user_deposit_price_usd[pool_key].get(address, 0)

        # Get last action timestamp
        last_action_timestamp = self.pool_user_last_action_timestamp[pool_key].get(address, 0)

        # Calculate profit/loss
        if initial_value_usd == 0:
            profit_amount_usd = Amount(0)
            profit_percentage = Amount(0)
        else:
            profit_amount_usd = (current_value_usd - initial_value_usd)
            # Calculate percentage with 2 decimal places (e.g., 341 = 3.41%)
            profit_percentage = ((profit_amount_usd * 10000) // initial_value_usd)

        return UserProfitInfo(
            current_value_usd=current_value_usd,
            initial_value_usd=Amount(initial_value_usd),
            profit_amount_usd=profit_amount_usd,
            profit_percentage=profit_percentage,
            last_action_timestamp=last_action_timestamp,
        )


    @view
    def find_best_swap_path(
        self, amount_in: Amount, token_in: TokenUid, token_out: TokenUid, max_hops: int
    ) -> SwapPathInfo:
        """Find the best path for swapping between two tokens using Dijkstra's algorithm.

        This method calculates the optimal path for swapping from token_in to token_out,
        using Dijkstra's algorithm to guarantee the best possible output amount.

        Args:
            amount_in: The amount of input tokens
            token_in: The input token
            token_out: The output token
            max_hops: Maximum number of hops (1-3, but algorithm handles any number)

        Returns:
            A SwapPathInfo NamedTuple containing:
            - path: Comma-separated string of pool keys to traverse
            - amounts: Expected amounts at each step
            - amount_out: Final expected output amount
            - price_impact: Overall price impact
        """
        # Limit max_hops to reasonable number for gas efficiency
        if max_hops > 5:
            max_hops = 5

        # Build graph of all possible token pairs and their exchange rates
        graph = self._build_token_graph(amount_in)

        if token_in not in graph:
            return SwapPathInfo(
                path="",
                amounts=[amount_in],
                amount_out=Amount(0),
                price_impact=Amount(0),
            )

        # Run Dijkstra's algorithm to find optimal path
        path_info = self._dijkstra_shortest_path(
            graph, token_in, token_out, amount_in, max_hops
        )

        if not path_info["path"]:
            return SwapPathInfo(
                path="",
                amounts=[amount_in],
                amount_out=Amount(0),
                price_impact=Amount(0),
            )

        # Calculate price impact for the optimal path
        price_impact = self._calculate_price_impact(
            amount_in, path_info["amount_out"], path_info["path"], token_in, token_out
        )

        return SwapPathInfo(
            path=path_info["path"],
            amounts=path_info["amounts"],
            amount_out=path_info["amount_out"],
            price_impact=price_impact,
        )

    @view
    def _build_token_graph(
        self, reference_amount: Amount
    ) -> dict[TokenUid, dict[TokenUid, tuple[Amount, str, Amount]]]:
        """Build a graph of tokens with edge weights as (output_amount, pool_key, fee).

        Args:
            reference_amount: Reference amount to calculate exchange rates

        Returns:
            Graph structure: token -> {neighbor_token: (output_amount, pool_key, fee)}
        """
        graph = {}

        # Try different fee tiers for each pool to find the best rates
        fee_tiers = [Amount(3), Amount(5), Amount(10), Amount(30)]

        for pool_key in self.all_pools:
            pool = self.pools[pool_key]
            token_a = pool.token_a
            token_b = pool.token_b
            fee = pool.fee_numerator
            fee_denominator = pool.fee_denominator

            # Check if pool has valid reserves for A->B calculation
            reserve_a = pool.reserve_a
            reserve_b = pool.reserve_b
            
            if reserve_a > 0 and reserve_b > 0 and fee_denominator > 0:
                # Calculate A->B exchange rate
                a = fee_denominator - fee
                b = fee_denominator
                denominator = reserve_a * b + reference_amount * a
                
                if denominator > 0:
                    output_b = (reserve_b * reference_amount * a) // denominator
                    if output_b <= reserve_b:  # Ensure output doesn't exceed reserves
                        if token_a not in graph:
                            graph[token_a] = {}

                        # Only add edge if it's better than existing edge or no edge exists
                        if (
                            token_b not in graph[token_a]
                            or output_b > graph[token_a][token_b][0]
                        ):
                            graph[token_a][token_b] = (output_b, pool_key, fee)

            # Check if pool has valid reserves for B->A calculation
            if reserve_a > 0 and reserve_b > 0 and fee_denominator > 0:
                # Calculate B->A exchange rate
                a = fee_denominator - fee
                b = fee_denominator
                denominator = reserve_b * b + reference_amount * a
                
                if denominator > 0:
                    output_a = (reserve_a * reference_amount * a) // denominator
                    if output_a <= reserve_a:  # Ensure output doesn't exceed reserves
                        if token_b not in graph:
                            graph[token_b] = {}

                        # Only add edge if it's better than existing edge or no edge exists
                        if (
                            token_a not in graph[token_b]
                            or output_a > graph[token_b][token_a][0]
                        ):
                            graph[token_b][token_a] = (output_a, pool_key, fee)

        return graph

    @view
    def _dijkstra_shortest_path(
        self,
        graph: dict[TokenUid, dict[TokenUid, tuple[Amount, str, Amount]]],
        start: TokenUid,
        end: TokenUid,
        amount_in: Amount,
        max_hops: int,
    ) -> dict[str, str | list[Amount] | int]:
        """Find the optimal path using Dijkstra's algorithm.

        Args:
            graph: Token graph with exchange rates
            start: Starting token
            end: Target token
            amount_in: Input amount
            max_hops: Maximum number of hops allowed

        Returns:
            Dictionary with path information
        """
        # Initialize distances (we want to maximize output, so we use negative distances)
        # distances[token] = (max_output_amount, hops_count)
        distances = {}
        previous = {}
        unvisited = set()

        # Initialize all tokens
        for token in graph.keys():
            distances[token] = (0, 0)  # (amount, hops)
            unvisited.add(token)

        # Set start token distance to input amount
        distances[start] = (amount_in, 0)

        while unvisited:
            # Find unvisited token with maximum output amount
            current = None
            max_amount = 0

            for token in unvisited:
                amount, hops = distances[token]
                if amount > max_amount:
                    max_amount = amount
                    current = token

            if current is None or max_amount == 0:
                break  # No reachable tokens

            if current == end:
                break  # Found target

            current_amount, current_hops = distances[current]

            # Skip if we've exceeded max hops
            if current_hops >= max_hops:
                unvisited.remove(current)
                continue

            unvisited.remove(current)

            # Check all neighbors
            for neighbor, (reference_output, pool_key, fee) in graph.get(
                current, {}
            ).items():
                pool = self.pools[pool_key]
                if neighbor not in unvisited:
                    continue

                # Calculate actual output for current amount
                # Get current reserves for this pool
                if pool.token_a == current:
                    reserve_in = pool.reserve_a
                    reserve_out = pool.reserve_b
                else:
                    reserve_in = pool.reserve_b
                    reserve_out = pool.reserve_a

                # Check if calculation is valid
                if reserve_in > 0 and reserve_out > 0:
                    fee_denominator = pool.fee_denominator
                    if fee_denominator > 0:
                        a = fee_denominator - fee
                        b = fee_denominator
                        denominator = reserve_in * b + current_amount * a
                        
                        if denominator > 0:
                            actual_output = (reserve_out * current_amount * a) // denominator
                            if actual_output <= reserve_out:  # Ensure output doesn't exceed reserves
                                neighbor_amount, neighbor_hops = distances[neighbor]
                                new_hops = current_hops + 1

                                # Update if we found a better path
                                if actual_output > neighbor_amount:
                                    distances[neighbor] = (actual_output, new_hops)
                                    previous[neighbor] = (current, pool_key)

        # Reconstruct path
        if end not in previous and end != start:
            return {"path": "", "amounts": [amount_in], "amount_out": 0}

        path_pools = []
        amounts = []
        current = end

        # Build path backwards
        while current in previous:
            prev_token, pool_key = previous[current]
            path_pools.insert(0, pool_key)
            amounts.insert(0, distances[current][0])
            current = prev_token

        amounts.insert(0, amount_in)
        final_amount = distances[end][0] if end in distances else 0

        return {
            "path": ",".join(path_pools),
            "amounts": amounts,
            "amount_out": final_amount,
        }

    @view
    def _calculate_price_impact(
        self,
        amount_in: Amount,
        amount_out: Amount,
        path: str,
        token_in: TokenUid,
        token_out: TokenUid,
    ) -> Amount:
        """Calculate price impact for a swap path.

        Args:
            amount_in: Input amount
            amount_out: Output amount
            path: Comma-separated pool keys
            token_in: Input token
            token_out: Output token

        Returns:
            Price impact as a percentage (with precision)
        """
        if not path or amount_out == 0:
            return Amount(0)

        # For direct swaps, calculate price impact using pool reserves
        pool_keys = path.split(",")
        if len(pool_keys) == 1:
            pool_key = pool_keys[0]
            pool = self.pools[pool_key]

            # Get reserves
            if pool.token_a == token_in:
                reserve_in = pool.reserve_a
                reserve_out = pool.reserve_b
            else:
                reserve_in = pool.reserve_b
                reserve_out = pool.reserve_a

            # Calculate quote without fees
            if reserve_in > 0:
                no_fee_quote = (amount_in * reserve_out) // reserve_in

                if no_fee_quote > 0:
                    # Price impact = (no_fee_quote - actual_output) / no_fee_quote * 10000
                    # Return as integer with 2 decimal precision (e.g., 3.41% = 341)
                    price_impact = (10000 * (no_fee_quote - amount_out)) // no_fee_quote
                    return Amount(max(0, price_impact))

        # For multi-hop, calculate cumulative price impact across all pools
        return self._calculate_multi_hop_price_impact(
            amount_in, amount_out, pool_keys, token_in, token_out
        )

    @view
    def _calculate_multi_hop_price_impact(
        self,
        amount_in: Amount,
        amount_out: Amount,
        pool_keys: list[str],
        token_in: TokenUid,
        token_out: TokenUid,
    ) -> Amount:
        """Calculate price impact for multi-hop swaps.
        
        The strategy is to calculate the theoretical amount out using spot prices
        (without considering slippage) and compare it with the actual amount out.
        
        Args:
            amount_in: Input amount
            amount_out: Actual output amount
            pool_keys: List of pool keys in the swap path
            token_in: Input token
            token_out: Output token
            
        Returns:
            Price impact as a percentage (with precision)
        """
        if len(pool_keys) <= 1 or amount_out == 0:
            return Amount(0)
            
        # Calculate theoretical amount out using spot prices (no slippage)
        theoretical_amount_out = self._calculate_theoretical_multi_hop_output(
            amount_in, pool_keys, token_in, token_out
        )
        
        if theoretical_amount_out == 0:
            return Amount(0)
            
        # Price impact = (theoretical - actual) / theoretical * 10000
        # Return as integer with 2 decimal precision (e.g., 3.41% = 341)
        price_impact = (10000 * (theoretical_amount_out - amount_out)) // theoretical_amount_out
        return Amount(max(0, min(price_impact, 10000)))  # Cap at 100.00% = 10000
            
    @view
    def _calculate_theoretical_multi_hop_output(
        self,
        amount_in: Amount,
        pool_keys: list[str],
        token_in: TokenUid,
        token_out: TokenUid,
    ) -> Amount:
        """Calculate theoretical output for multi-hop swap using spot prices.
        
        This simulates the swap using very small amounts to approximate spot prices,
        avoiding the slippage that occurs with large trades.
        
        Args:
            amount_in: Input amount
            pool_keys: List of pool keys in the swap path
            token_in: Input token
            token_out: Output token
            
        Returns:
            Theoretical output amount
        """
        # Use a small reference amount (1% of input) to calculate spot rates
        ref_amount = max(Amount(1), amount_in // 100)
        current_amount = ref_amount
        current_token = token_in
        
        # Trace through each pool to get the exchange rate
        for pool_key in pool_keys:
            if pool_key not in self.all_pools:
                return Amount(0)
            
            pool = self.pools[pool_key]
                
            token_a = pool.token_a
            token_b = pool.token_b
            
            # Determine which direction we're swapping
            if current_token == token_a:
                # Swapping A -> B
                reserve_in = pool.reserve_a
                reserve_out = pool.reserve_b
                current_token = token_b
            elif current_token == token_b:
                # Swapping B -> A
                reserve_in = pool.reserve_b
                reserve_out = pool.reserve_a
                current_token = token_a
            else:
                # Token not found in this pool
                return Amount(0)
                
            # Calculate spot price output (without fees for theoretical calculation)
            if reserve_in == 0:
                return Amount(0)
                
            # Use spot price formula: output = input * reserve_out / reserve_in
            current_amount = (current_amount * reserve_out) // reserve_in
            
            if current_amount == 0:
                return Amount(0)
                
        # Scale the result back to the original amount
        if ref_amount == 0:
            return Amount(0)
            
        theoretical_output = (current_amount * amount_in) // ref_amount
        return Amount(theoretical_output)



    @view
    def find_best_swap_path_exact_output(
        self, amount_out: Amount, token_in: TokenUid, token_out: TokenUid, max_hops: int
    ) -> SwapPathExactOutputInfo:
        """Find the best path for swapping to get exact output amount using reverse pathfinding.

        This method calculates the optimal path for swapping from token_in to token_out,
        using reverse Dijkstra's algorithm to guarantee the minimum input amount needed.

        Args:
            amount_out: The desired output amount
            token_in: The input token
            token_out: The output token
            max_hops: Maximum number of hops (1-3, but algorithm handles any number)

        Returns:
            A SwapPathExactOutputInfo NamedTuple containing:
            - path: Comma-separated string of pool keys to traverse
            - amounts: Expected amounts at each step (reverse order)
            - amount_in: Required input amount
            - price_impact: Overall price impact
        """
        # Limit max_hops to reasonable number for gas efficiency
        if max_hops > 5:
            max_hops = 5

        # Build reverse graph of all possible token pairs and their exchange rates
        graph = self._build_reverse_token_graph(amount_out)

        if token_out not in graph:
            return SwapPathExactOutputInfo(
                path="",
                amounts=[amount_out],
                amount_in=Amount(0),
                price_impact=Amount(0),
            )

        # Run reverse Dijkstra's algorithm to find optimal path
        path_info = self._dijkstra_reverse_shortest_path(
            graph, token_out, token_in, amount_out, max_hops
        )

        if not path_info["path"]:
            return SwapPathExactOutputInfo(
                path="",
                amounts=[amount_out],
                amount_in=Amount(0),
                price_impact=Amount(0),
            )

        # Calculate price impact for the optimal path
        price_impact = self._calculate_price_impact(
            path_info["amount_in"], amount_out, path_info["path"], token_in, token_out
        )

        return SwapPathExactOutputInfo(
            path=path_info["path"],
            amounts=path_info["amounts"],
            amount_in=path_info["amount_in"],
            price_impact=price_impact,
        )

    @view
    def _build_reverse_token_graph(
        self, reference_amount: Amount
    ) -> dict[TokenUid, dict[TokenUid, tuple[Amount, str, Amount]]]:
        """Build a reverse graph of tokens with edge weights as (input_amount, pool_key, fee).

        Args:
            reference_amount: Reference amount to calculate exchange rates

        Returns:
            Graph structure: token -> {neighbor_token: (input_amount, pool_key, fee)}
        """
        graph = {}

        for pool_key in self.all_pools:
            pool = self.pools[pool_key]
            token_a = pool.token_a
            token_b = pool.token_b
            fee = pool.fee_numerator
            fee_denominator = pool.fee_denominator

            # Check if pool has valid reserves for A->B calculation (reverse: how much A needed for reference_amount B)
            reserve_a = pool.reserve_a
            reserve_b = pool.reserve_b
            
            if reserve_a > 0 and reserve_b > 0 and fee_denominator > 0 and reference_amount < reserve_b:
                a = fee_denominator - fee
                b = fee_denominator
                denominator = (reserve_b - reference_amount) * a
                
                if denominator > 0:
                    input_a = (reserve_a * reference_amount * b) // denominator

                    if token_b not in graph:
                        graph[token_b] = {}

                    # Only add edge if it's better than existing edge or no edge exists
                    if (
                        token_a not in graph[token_b]
                        or graph[token_b][token_a][0] > input_a
                    ):
                        graph[token_b][token_a] = (input_a, pool_key, fee)

            # Check if pool has valid reserves for B->A calculation (reverse: how much B needed for reference_amount A)
            if reserve_a > 0 and reserve_b > 0 and fee_denominator > 0 and reference_amount < reserve_a:
                a = fee_denominator - fee
                b = fee_denominator
                denominator = (reserve_a - reference_amount) * a
                
                if denominator > 0:
                    input_b = (reserve_b * reference_amount * b) // denominator

                    if token_a not in graph:
                        graph[token_a] = {}

                    # Only add edge if it's better than existing edge or no edge exists
                    if (
                        token_b not in graph[token_a]
                        or graph[token_a][token_b][0] > input_b
                    ):
                        graph[token_a][token_b] = (input_b, pool_key, fee)

        return graph

    @view
    def _dijkstra_reverse_shortest_path(
        self,
        graph: dict[TokenUid, dict[TokenUid, tuple[Amount, str, Amount]]],
        start_token: TokenUid,
        end_token: TokenUid,
        amount_out: Amount,
        max_hops: int,
    ) -> dict[str, str | list[Amount] | int]:
        """Use Dijkstra's algorithm to find the path that minimizes input amount for exact output.

        Args:
            graph: The token graph with reverse edge weights
            start_token: Starting token (output token)
            end_token: Ending token (input token)
            amount_out: Desired output amount
            max_hops: Maximum number of hops

        Returns:
            Dictionary with path, amounts, and required input amount
        """
        # distances[token] = (min_amount_of_token_needed, hops)
        distances = {}
        previous = {}
        unvisited = set()

        # Initialize all tokens with a very large number for infinity
        for token in graph.keys():
            distances[token] = (Amount(2**256 - 1), 0)
            unvisited.add(token)

        # We want to obtain `amount_out` of `start_token`.
        distances[start_token] = (amount_out, 0)

        while unvisited:
            # Find unvisited token with minimum required amount.
            current = None
            min_amount = Amount(2**256 - 1)

            for token in unvisited:
                amount, _ = distances[token]
                if token in unvisited and amount < min_amount:
                    min_amount = amount
                    current = token

            if current is None or min_amount == Amount(2**256 - 1):
                break  # No reachable tokens

            if current == end_token:
                break  # Found target

            current_amount, current_hops = distances[current]

            if current_hops >= max_hops:
                unvisited.remove(current)
                continue

            unvisited.remove(current)

            # Explore neighbors. In the reverse graph, neighbors are tokens that can produce the current token.
            if current not in graph:
                continue

            for neighbor, (
                reference_input,
                pool_key,
                fee,
            ) in graph.get(current, {}).items():
                if neighbor not in unvisited:
                    continue
                
                pool = self.pools[pool_key]

                # We need `current_amount` of `current` token. How much `neighbor` token is needed?
                # We are swapping from `neighbor` (in) to `current` (out).
                reserve_in = self._get_reserve(neighbor, pool_key)
                reserve_out = self._get_reserve(current, pool_key)

                # Check if calculation is valid
                if reserve_in > 0 and reserve_out > 0:
                    fee_denominator = pool.fee_denominator
                    if fee_denominator > 0 and current_amount < reserve_out:
                        a = fee_denominator - fee
                        b = fee_denominator
                        denominator = (reserve_out - current_amount) * a
                        
                        if denominator > 0:
                            required_input_for_neighbor = (reserve_in * current_amount * b) // denominator

                            neighbor_amount, _ = distances[neighbor]
                            new_hops = current_hops + 1

                            if required_input_for_neighbor < neighbor_amount:
                                distances[neighbor] = (required_input_for_neighbor, new_hops)
                                previous[neighbor] = (current, pool_key)

        # Reconstruct path
        final_input_amount = distances.get(end_token, (Amount(2**256 - 1), 0))[0]

        if final_input_amount == Amount(2**256 - 1):
            return {"path": "", "amounts": [amount_out], "amount_in": 0}

        path_pools = []
        amounts = []
        current = end_token

        # Build path backwards from `end_token` to `start_token`.
        while current in previous:
            prev_token, pool_key = previous[current]
            path_pools.insert(0, pool_key)
            amounts.insert(0, distances[current][0])
            current = prev_token

        amounts.insert(0, distances[start_token][0])

        return {
            "path": ",".join(path_pools),
            "amounts": amounts,
            "amount_in": final_input_amount,
        }



    @view
    def calculate_amount_out(
        self,
        amount_in: Amount,
        token_in: TokenUid,
        token_out: TokenUid,
        fee: Amount,
        fee_denominator: Amount = Amount(1000),
    ) -> Amount:
        """Calculate the output amount for a given input amount, taking into account the fee denominator.

        This is a specialized version of get_amount_out for cross-pool swaps.

        Args:
            amount_in: The amount of input tokens
            token_in: The input token
            token_out: The output token
            fee: The pool fee
            fee_denominator: The denominator for the fee calculation (default: 1000)

        Returns:
            The maximum output amount

        Raises:
            PoolNotFound: If the pool does not exist
            InsufficientLiquidity: If there is not enough liquidity
        """
        pool_key = self._get_pool_key(token_in, token_out, fee)
        if pool_key not in self.all_pools:
            raise PoolNotFound()

        # Get reserves
        reserve_in = 0
        reserve_out = 0

        pool = self.pools[pool_key]

        if pool.token_a == token_in:
            reserve_in = pool.reserve_a
            reserve_out = pool.reserve_b
        else:
            reserve_in = pool.reserve_b
            reserve_out = pool.reserve_a

        if reserve_in == 0 or reserve_out == 0:
            raise InsufficientLiquidity()

        # Calculate amount out with fee
        amount_in_with_fee = amount_in * (fee_denominator - fee)
        numerator = amount_in_with_fee * reserve_out
        denominator = reserve_in * fee_denominator + amount_in_with_fee

        return Amount(numerator // denominator)

    @view
    def calculate_amount_in(
        self,
        amount_out: Amount,
        token_in: TokenUid,
        token_out: TokenUid,
        fee: Amount,
        fee_denominator: Amount = Amount(1000),
    ) -> Amount:
        """Calculate the input amount required for a desired output amount, taking into account the fee denominator.

        This is a specialized version of get_amount_in for cross-pool swaps.

        Args:
            amount_out: The desired amount of output tokens
            token_in: The input token
            token_out: The output token
            fee: The pool fee
            fee_denominator: The denominator for the fee calculation (default: 1000)

        Returns:
            The minimum input amount required

        Raises:
            PoolNotFound: If the pool does not exist
            InsufficientLiquidity: If there is not enough liquidity
        """
        pool_key = self._get_pool_key(token_in, token_out, fee)
        if pool_key not in self.all_pools:
            raise PoolNotFound()

        # Get reserves
        reserve_in = 0
        reserve_out = 0

        pool = self.pools[pool_key]

        if pool.token_a == token_in:
            reserve_in = pool.reserve_a
            reserve_out = pool.reserve_b
        else:
            reserve_in = pool.reserve_b
            reserve_out = pool.reserve_a

        if reserve_in == 0 or reserve_out == 0 or amount_out >= reserve_out:
            raise InsufficientLiquidity()

        # Calculate amount in with fee
        numerator = Amount(reserve_in * amount_out * fee_denominator)
        denominator = Amount((reserve_out - amount_out) * (fee_denominator - fee))

        # Round up
        return Amount(numerator // denominator)