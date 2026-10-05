from typing import NamedTuple
from hathor import Blueprint, BlueprintId, Context, NCFail, Address, Amount, CallerId, NCDepositAction, NCWithdrawalAction, Timestamp, TokenUid, NCAction, NCActionType, public, view, export, HATHOR_TOKEN_UID
PRECISION = Amount(10 ** 20)
MINIMUM_LIQUIDITY = Amount(10 ** 3)
MAX_POOLS_TO_ITERATE = 1000
MAX_PAGE_SIZE = 100
PRICE_PRECISION = 10 ** 8
MAX_PRICE_IMPACT = Amount(500)
PoolKey = str
class PoolState(NamedTuple):
    token_a: TokenUid
    token_b: TokenUid
    reserve_a: Amount
    reserve_b: Amount
    fee_numerator: Amount
    fee_denominator: Amount
    total_liquidity: Amount
    total_change_a: Amount
    total_change_b: Amount
    transactions: Amount
    last_activity: int
    volume_a: Amount
    volume_b: Amount
    price_a_window_sum: Amount
    price_b_window_sum: Amount
    block_timestamp_last: int
    twap_window: int
class PoolExists(NCFail):
    pass
class PoolNotFound(NCFail):
    pass
class InvalidTokens(NCFail):
    pass
class InvalidFee(NCFail):
    pass
class InvalidAction(NCFail):
    pass
class InvalidVersion(NCFail):
    pass
class Unauthorized(NCFail):
    pass
class InvalidPath(NCFail):
    pass
class InsufficientLiquidity(NCFail):
    pass
class InvalidState(NCFail):
    pass
class SwapResult(NamedTuple):
    amount_in: Amount
    change_in: Amount
    token_in: TokenUid
    amount_out: Amount
    token_out: TokenUid
class PoolApiInfo(NamedTuple):
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
    liquidity: Amount
    token0Amount: Amount
    token1Amount: Amount
    share: Amount
    balance_a: Amount
    balance_b: Amount
    token_a: str
    token_b: str
class UserPosition(NamedTuple):
    liquidity: Amount
    token0Amount: Amount
    token1Amount: Amount
    share: Amount
    balance_a: Amount
    balance_b: Amount
    token_a: str
    token_b: str
class SwapPathInfo(NamedTuple):
    path: str
    amounts: list[Amount]
    amount_out: Amount
    price_impact: Amount
class SwapPathExactOutputInfo(NamedTuple):
    path: str
    amounts: list[Amount]
    amount_in: Amount
    price_impact: Amount
class UserProfitInfo(NamedTuple):
    current_value_usd: Amount
    initial_value_usd: Amount
    profit_amount_usd: int
    profit_percentage: int
    last_action_timestamp: int
class SingleTokenLiquidityQuote(NamedTuple):
    liquidity_amount: Amount
    token_a_used: Amount
    token_b_used: Amount
    excess_token: str
    excess_amount: Amount
    swap_amount: Amount
    swap_output: Amount
    price_impact: Amount
    protocol_liquidity_increase: Amount
class SingleTokenRemovalQuote(NamedTuple):
    amount_out: Amount
    token_a_withdrawn: Amount
    token_b_withdrawn: Amount
    swap_amount: Amount
    swap_output: Amount
    price_impact: Amount
    user_liquidity: Amount
    protocol_liquidity_increase: Amount
class _AddLiquiditySingleTokenResult(NamedTuple):
    optimal_swap_amount: Amount
    swap_output: Amount
    reserve_a_after_swap: Amount
    reserve_b_after_swap: Amount
    token_a_amount: Amount
    token_b_amount: Amount
    liquidity_increase: Amount
    actual_a: Amount
    actual_b: Amount
    excess_a: Amount
    excess_b: Amount
    protocol_liquidity_increase: Amount
class _RemoveLiquiditySingleTokenResult(NamedTuple):
    amount_a: Amount
    amount_b: Amount
    swap_amount: Amount
    swap_output: Amount
    total_amount_out: Amount
    reserve_a_after: Amount
    reserve_b_after: Amount
    protocol_liquidity_increase: Amount
@export
class DozerPoolManager(Blueprint):
    contract_version: str
    owner: Address
    default_protocol_fee: Amount
    authorized_signers: set[CallerId]
    htr_usd_pool_key: str | None
    paused: bool
    all_pools: list[str]
    token_to_pools: dict[TokenUid, list[str]]
    signed_pools: list[str]
    pool_signers: dict[str, CallerId]
    reserved_pools: dict[TokenUid, CallerId]
    htr_token_map: dict[TokenUid, str]
    pools: dict[str, PoolState]
    pool_user_liquidity: dict[str, dict[CallerId, Amount]]
    pool_change: dict[str, dict[CallerId, tuple[Amount, Amount]]]
    pool_accumulated_fee: dict[str, dict[TokenUid, Amount]]
    pool_user_deposit_price_usd: dict[str, dict[CallerId, Amount]]
    pool_user_last_action_timestamp: dict[str, dict[CallerId, int]]
    default_twap_window: int
    @public
    def initialize(self, ctx: Context) -> None:
        self.contract_version = '1.0.0'
        self.owner = Address(ctx.caller_id)
        self.default_protocol_fee = Amount(40)
        self.authorized_signers: set[CallerId] = set()
        self.all_pools: list[str] = []
        self.token_to_pools: dict[TokenUid, list[str]] = {}
        self.signed_pools: list[str] = []
        self.pool_signers: dict[str, CallerId] = {}
        self.reserved_pools: dict[TokenUid, CallerId] = {}
        self.htr_token_map: dict[TokenUid, str] = {}
        self.pools: dict[str, PoolState] = {}
        self.pool_user_liquidity: dict[str, dict[CallerId, Amount]] = {}
        self.pool_change: dict[str, dict[CallerId, tuple[Amount, Amount]]] = {}
        self.pool_accumulated_fee: dict[str, dict[TokenUid, Amount]] = {}
        self.pool_user_deposit_price_usd: dict[str, dict[CallerId, Amount]] = {}
        self.pool_user_last_action_timestamp: dict[str, dict[CallerId, int]] = {}
        self.authorized_signers.add(self.owner)
        self.htr_usd_pool_key = None
        self.paused = False
        self.default_twap_window = 14400
        self.log.info('contract initialized', owner=str(self.owner), protocol_fee=self.default_protocol_fee, version=self.contract_version)
    def _get_pool_key(self, token_a: TokenUid, token_b: TokenUid, fee: Amount) -> PoolKey:
        token_a, token_b = self._order_tokens(token_a, token_b)
        return f'{token_a.hex()}/{token_b.hex()}/{fee}'
    def _validate_pool_exists(self, pool_key: str) -> None:
        if pool_key not in self.pools:
            raise PoolNotFound(f'Pool does not exist: {pool_key}')
    def _get_deposit_action(self, ctx: Context, token_uid: TokenUid) -> NCDepositAction:
        action = ctx.get_single_action(token_uid)
        if not isinstance(action, NCDepositAction):
            raise InvalidAction(f'Must provide a deposit action for {token_uid.hex()}')
        return action
    def _get_withdrawal_action(self, ctx: Context, token_uid: TokenUid) -> NCWithdrawalAction:
        action = ctx.get_single_action(token_uid)
        if not isinstance(action, NCWithdrawalAction):
            raise InvalidAction(f'Must provide a withdrawal action for {token_uid.hex()}')
        return action
    def _ceil_div(self, numerator: Amount, denominator: Amount) -> Amount:
        return Amount((numerator + denominator - 1) // denominator)
    def _order_tokens(self, token_a: TokenUid, token_b: TokenUid) -> tuple[TokenUid, TokenUid]:
        if token_a > token_b:
            return (token_b, token_a)
        return (token_a, token_b)
    def _update_pool(self, pool_key: str, **kwargs) -> None:
        pool = self.pools[pool_key]
        self.pools[pool_key] = pool._replace(**kwargs)
    def _setup_pool_from_context(self, ctx: Context, fee: Amount) -> tuple[str, PoolState, CallerId]:
        token_a, token_b = set(ctx.actions.keys())
        token_a, token_b = self._order_tokens(token_a, token_b)
        pool_key = self._get_pool_key(token_a, token_b, fee)
        self._validate_pool_exists(pool_key)
        return (pool_key, self.pools[pool_key], ctx.caller_id)
    def _check_not_paused(self, ctx: Context) -> None:
        if self.paused and ctx.caller_id != self.owner:
            raise InvalidState('Contract is paused')
    def _update_user_liquidity(self, pool_key: PoolKey, user_address: CallerId, delta_liquidity: Amount) -> None:
        user_liquidity = self.pool_user_liquidity[pool_key]
        current = user_liquidity.get(user_address, Amount(0))
        user_liquidity[user_address] = Amount(current + delta_liquidity)
    def _calculate_protocol_fee(self, fee_amount: Amount) -> Amount:
        protocol_fee_product = fee_amount * self.default_protocol_fee
        if protocol_fee_product > 0 and protocol_fee_product < 100:
            return Amount(1)
        return Amount(protocol_fee_product // 100)
    def _calculate_swap_fee(self, amount_in: Amount, fee_numerator: Amount, fee_denominator: Amount) -> Amount:
        return self._ceil_div(Amount(amount_in * fee_numerator), Amount(fee_denominator))
    def _accumulate_pool_fee(self, pool_key: str, token: TokenUid, fee_amount: Amount) -> None:
        accumulated_fee = self.pool_accumulated_fee[pool_key]
        accumulated_fee[token] = Amount(accumulated_fee.get(token, 0) + fee_amount)
    def _simulate_protocol_fee_liquidity_increase(self, pool_key: str, token_in: TokenUid, fee_amount: Amount, current_total_liquidity: Amount) -> Amount:
        protocol_fee_amount = self._calculate_protocol_fee(fee_amount)
        if protocol_fee_amount == 0:
            return Amount(0)
        pool = self.pools[pool_key]
        if token_in == pool.token_a:
            product_after = Amount((pool.reserve_a + protocol_fee_amount) * pool.reserve_b)
            product_before = Amount(pool.reserve_a * pool.reserve_b)
        else:
            product_after = Amount(pool.reserve_a * (pool.reserve_b + protocol_fee_amount))
            product_before = Amount(pool.reserve_a * pool.reserve_b)
        sqrt_after = self._isqrt(product_after)
        sqrt_before = self._isqrt(product_before)
        delta_sqrt = sqrt_after - sqrt_before
        liquidity_increase = delta_sqrt * PRECISION
        return Amount(liquidity_increase)
    def _process_protocol_fee(self, pool_key: str, token_in: TokenUid, fee_amount: Amount) -> Amount:
        protocol_fee_amount = self._calculate_protocol_fee(fee_amount)
        liquidity_increase = self._get_protocol_liquidity_increase(protocol_fee_amount, token_in, pool_key)
        user_liquidity = self.pool_user_liquidity[pool_key]
        user_liquidity[self.owner] = Amount(user_liquidity.get(self.owner, 0) + liquidity_increase)
        pool = self.pools[pool_key]
        self._update_pool(pool_key, total_liquidity=Amount(pool.total_liquidity + liquidity_increase))
        return liquidity_increase
    def _process_swap_fees(self, pool_key: str, token_in: TokenUid, amount_in: Amount, fee_numerator: Amount, fee_denominator: Amount) -> Amount:
        fee_amount = self._calculate_swap_fee(amount_in, fee_numerator, fee_denominator)
        self._accumulate_pool_fee(pool_key, token_in, fee_amount)
        return self._process_protocol_fee(pool_key, token_in, fee_amount)
    def _simulate_swap_fees(self, pool_key: str, token_in: TokenUid, amount_in: Amount, fee_numerator: Amount, fee_denominator: Amount, current_total_liquidity: Amount) -> tuple[Amount, Amount]:
        fee_amount = self._calculate_swap_fee(amount_in, fee_numerator, fee_denominator)
        liquidity_increase = self._simulate_protocol_fee_liquidity_increase(pool_key, token_in, fee_amount, current_total_liquidity)
        return (fee_amount, liquidity_increase)
    def _get_actions_in_in(self, ctx: Context, pool_key: str) -> tuple[NCDepositAction, NCDepositAction]:
        pool = self.pools[pool_key]
        token_a = pool.token_a
        token_b = pool.token_b
        if set(ctx.actions.keys()) != {token_a, token_b}:
            raise InvalidTokens('Only token_a and token_b are allowed')
        action_a = self._get_deposit_action(ctx, token_a)
        action_b = self._get_deposit_action(ctx, token_b)
        return (action_a, action_b)
    def _get_actions_out_out(self, ctx: Context, pool_key: str) -> tuple[NCWithdrawalAction, NCWithdrawalAction]:
        pool = self.pools[pool_key]
        token_a = pool.token_a
        token_b = pool.token_b
        if set(ctx.actions.keys()) != {token_a, token_b}:
            raise InvalidTokens('Only token_a and token_b are allowed')
        action_a = self._get_withdrawal_action(ctx, token_a)
        action_b = self._get_withdrawal_action(ctx, token_b)
        return (action_a, action_b)
    def _get_actions_in_out(self, ctx: Context, pool_key: str) -> tuple[NCDepositAction, NCWithdrawalAction]:
        pool = self.pools[pool_key]
        token_a = pool.token_a
        token_b = pool.token_b
        if set(ctx.actions.keys()) != {token_a, token_b}:
            raise InvalidTokens('Only token_a and token_b are allowed')
        return self._get_deposit_and_withdrawal_actions(ctx)
    def _get_deposit_and_withdrawal_actions(self, ctx: Context) -> tuple[NCDepositAction, NCWithdrawalAction]:
        token_uids = list(ctx.actions.keys())
        if len(token_uids) != 2:
            raise InvalidAction('Must have exactly 2 tokens in transaction')
        token_1, token_2 = token_uids
        action_1 = ctx.get_single_action(token_1)
        action_2 = ctx.get_single_action(token_2)
        if isinstance(action_1, NCDepositAction) and isinstance(action_2, NCWithdrawalAction):
            return (action_1, action_2)
        elif isinstance(action_2, NCDepositAction) and isinstance(action_1, NCWithdrawalAction):
            return (action_2, action_1)
        else:
            raise InvalidAction('Must have one deposit and one withdrawal')
    def _update_change(self, address: CallerId, amount: Amount, token: TokenUid, pool_key: str) -> None:
        if amount == 0:
            return
        pool = self.pools[pool_key]
        current_balance_a, current_balance_b = self.pool_change[pool_key].get(address, (Amount(0), Amount(0)))
        if token == pool.token_a:
            new_balance_a = Amount(current_balance_a + amount)
            self.pool_change[pool_key][address] = (new_balance_a, current_balance_b)
            new_total_change_a = pool.total_change_a + amount
            self._update_pool(pool_key, total_change_a=Amount(new_total_change_a))
        else:
            assert token == pool.token_b, f'Token {token} is not part of pool {pool_key}'
            new_balance_b = Amount(current_balance_b + amount)
            self.pool_change[pool_key][address] = (current_balance_a, new_balance_b)
            new_total_change_b = pool.total_change_b + amount
            self._update_pool(pool_key, total_change_b=Amount(new_total_change_b))
    def _update_reserve(self, amount: Amount, token_uid: TokenUid, pool_key: str) -> None:
        pool = self.pools[pool_key]
        if token_uid == pool.token_a:
            self._update_pool(pool_key, reserve_a=Amount(pool.reserve_a + amount))
        elif token_uid == pool.token_b:
            self._update_pool(pool_key, reserve_b=Amount(pool.reserve_b + amount))
        else:
            raise InvalidTokens('Token not in pool')
    def _resolve_token_direction(self, pool: PoolState, token_in: TokenUid) -> tuple[Amount, Amount, TokenUid]:
        result = self._try_resolve_token_direction(pool, token_in)
        if result is None:
            raise InvalidTokens(f'Token {token_in} not in pool')
        return result
    def _try_resolve_token_direction(self, pool: PoolState, token_in: TokenUid) -> tuple[Amount, Amount, TokenUid] | None:
        if pool.token_a == token_in:
            return (pool.reserve_a, pool.reserve_b, pool.token_b)
        elif pool.token_b == token_in:
            return (pool.reserve_b, pool.reserve_a, pool.token_a)
        else:
            return None
    def _get_other_token(self, pool: PoolState, token: TokenUid) -> TokenUid:
        if pool.token_a == token:
            return pool.token_b
        elif pool.token_b == token:
            return pool.token_a
        else:
            raise InvalidTokens(f'Token {token} not in pool')
    def _validate_token_in_pool(self, token: TokenUid, pool: PoolState, token_name: str='token') -> None:
        if token != pool.token_a and token != pool.token_b:
            raise InvalidTokens(f'{token_name} must be either token_a or token_b')
    def _get_volume_increments(self, token_in: TokenUid, amount_in: Amount, amount_out: Amount, pool: PoolState) -> tuple[Amount, Amount]:
        if token_in == pool.token_a:
            return (amount_in, amount_out)
        elif token_in == pool.token_b:
            return (amount_out, amount_in)
        else:
            raise InvalidTokens(f'Token {token_in} not in pool')
    def _update_user_profit_tracking(self, user_address: CallerId, pool_key: str, ctx: Context) -> None:
        current_usd_value = self._calculate_user_position_usd_value(user_address, pool_key)
        self.pool_user_deposit_price_usd[pool_key][user_address] = current_usd_value
        self.pool_user_last_action_timestamp[pool_key][user_address] = int(ctx.block.timestamp)
    def _calculate_user_position_usd_value(self, user_address: CallerId, pool_key: str) -> Amount:
        pool = self.pools[pool_key]
        user_liquidity = self.pool_user_liquidity[pool_key].get(user_address, Amount(0))
        if user_liquidity == 0:
            return Amount(0)
        if pool.total_liquidity == 0:
            return Amount(0)
        user_token_a_amount = pool.reserve_a * user_liquidity // pool.total_liquidity
        user_token_b_amount = pool.reserve_b * user_liquidity // pool.total_liquidity
        token_a_price_usd = self.get_token_price_in_usd(pool.token_a)
        token_b_price_usd = self.get_token_price_in_usd(pool.token_b)
        value_a_usd = user_token_a_amount * token_a_price_usd // 100000000
        value_b_usd = user_token_b_amount * token_b_price_usd // 100000000
        total_value = value_a_usd + value_b_usd
        return Amount(total_value)
    @view
    def quote(self, amount_a: Amount, reserve_a: Amount, reserve_b: Amount) -> Amount:
        amount_b = amount_a * reserve_b // reserve_a
        return Amount(amount_b)
    def _calculate_window_sums(self, pool: PoolState, time_elapsed: int, price_a_now: Amount, price_b_now: Amount) -> tuple[Amount, Amount]:
        if time_elapsed > 0:
            time_remaining = max(0, pool.twap_window - time_elapsed)
            time_weight_new = min(time_elapsed, pool.twap_window)
            new_window_sum_a = price_a_now * time_weight_new + pool.price_a_window_sum * time_remaining // pool.twap_window
            new_window_sum_b = price_b_now * time_weight_new + pool.price_b_window_sum * time_remaining // pool.twap_window
        else:
            new_window_sum_a = pool.price_a_window_sum
            new_window_sum_b = pool.price_b_window_sum
        return (Amount(new_window_sum_a), Amount(new_window_sum_b))
    def _update_twap(self, pool_key: str, ctx: Context) -> None:
        pool = self.pools.get(pool_key)
        if not pool:
            return
        current_timestamp = int(ctx.block.timestamp)
        if current_timestamp == pool.block_timestamp_last:
            return
        assert pool.block_timestamp_last > 0, 'Pool timestamp must be initialized (cannot be 0)'
        time_elapsed = current_timestamp - pool.block_timestamp_last
        assert time_elapsed > 0, 'Time elapsed must be positive after timestamp check'
        if pool.reserve_a > 0 and pool.reserve_b > 0:
            price_a = Amount(pool.reserve_b * PRICE_PRECISION // pool.reserve_a)
            price_b = Amount(pool.reserve_a * PRICE_PRECISION // pool.reserve_b)
            new_window_sum_a, new_window_sum_b = self._calculate_window_sums(pool, time_elapsed, price_a, price_b)
            self._update_pool(pool_key, price_a_window_sum=new_window_sum_a, price_b_window_sum=new_window_sum_b, block_timestamp_last=current_timestamp)
        else:
            self._update_pool(pool_key, block_timestamp_last=current_timestamp)
    def _check_k_not_decreased(self, k_before: Amount, k_after: Amount, operation: str) -> None:
        assert k_after >= k_before, f'K decreased in {operation}: {k_before} -> {k_after} (delta: {k_before - k_after})'
    def _check_price_ratio(self, reserve_a_before: Amount, reserve_b_before: Amount, reserve_a_after: Amount, reserve_b_after: Amount, operation: str, tolerance_ppm: int | None=None) -> None:
        if tolerance_ppm is None:
            min_reserve = min(reserve_a_after, reserve_b_after)
            if min_reserve < 1000:
                tolerance_ppm = 5000
            elif min_reserve < 10000:
                tolerance_ppm = 2000
            else:
                tolerance_ppm = 100
            if tolerance_ppm > 100:
                self.log.debug('using dynamic price ratio tolerance', operation=operation, min_reserve=min_reserve, tolerance_ppm=tolerance_ppm)
        ratio_check_before = reserve_a_before * reserve_b_after
        ratio_check_after = reserve_a_after * reserve_b_before
        diff = abs(ratio_check_before - ratio_check_after)
        max_value = max(ratio_check_before, ratio_check_after)
        assert diff * 1000000 <= max_value * tolerance_ppm, f'Price ratio violation in {operation}: ratio changed from {reserve_a_before}/{reserve_b_before} to {reserve_a_after}/{reserve_b_after} (diff: {diff}, tolerance: {tolerance_ppm}ppm)'
    @view
    def get_amount_out(self, amount_in: Amount, reserve_in: Amount, reserve_out: Amount, fee_numerator: int, fee_denominator: int) -> Amount:
        a = fee_denominator - fee_numerator
        b = fee_denominator
        amount_out = reserve_out * amount_in * a // (reserve_in * b + amount_in * a)
        assert amount_out <= reserve_out, f'Impossible: amount_out ({amount_out}) > reserve_out ({reserve_out})'
        return Amount(amount_out)
    @view
    def get_amount_in(self, amount_out: Amount, reserve_in: Amount, reserve_out: Amount, fee_numerator: int, fee_denominator: int) -> Amount:
        a = fee_denominator - fee_numerator
        b = fee_denominator
        numerator = Amount(reserve_in * amount_out * b)
        denominator = Amount((reserve_out - amount_out) * a)
        amount_in = self._ceil_div(numerator, denominator)
        return amount_in
    @view
    def front_quote_add_liquidity_in(self, amount_in: Amount, token_in: TokenUid, pool_key: str) -> Amount:
        if pool_key not in self.pools:
            raise PoolNotFound()
        pool = self.pools[pool_key]
        reserve_a = pool.reserve_a
        reserve_b = pool.reserve_b
        token_a = pool.token_a
        if token_in == token_a:
            quote = self.quote(amount_in, reserve_a, reserve_b)
        else:
            assert token_in == pool.token_b, f'Token {token_in} is not part of pool {pool_key}'
            quote = self.quote(amount_in, reserve_b, reserve_a)
        return quote
    @view
    def quote_add_liquidity_single_token(self, token_in: TokenUid, amount_in: Amount, token_out: TokenUid, fee: Amount) -> SingleTokenLiquidityQuote:
        if token_in == token_out:
            raise InvalidTokens('Input and output tokens cannot be the same')
        if token_in > token_out:
            token_a, token_b = (token_out, token_in)
        else:
            token_a, token_b = (token_in, token_out)
        pool_key = self._get_pool_key(token_a, token_b, fee)
        self._validate_pool_exists(pool_key)
        pool = self.pools[pool_key]
        result = self._compute_add_liquidity_single_token(amount_in=amount_in, token_in=token_in, reserve_a=pool.reserve_a, reserve_b=pool.reserve_b, token_a=token_a, token_b=token_b, total_liquidity=pool.total_liquidity, fee_numerator=pool.fee_numerator, fee_denominator=pool.fee_denominator, pool_key=pool_key)
        if result.excess_a > 0:
            excess_token = token_a
            excess_amount = result.excess_a
        elif result.excess_b > 0:
            excess_token = token_b
            excess_amount = result.excess_b
        else:
            excess_token = token_in
            excess_amount = Amount(0)
        reserve_in, reserve_out, _ = self._resolve_token_direction(pool, token_in)
        price_impact = self._calculate_single_swap_price_impact(result.optimal_swap_amount, result.swap_output, reserve_in, reserve_out)
        return SingleTokenLiquidityQuote(liquidity_amount=result.liquidity_increase, token_a_used=result.actual_a, token_b_used=result.actual_b, excess_token=excess_token.hex(), excess_amount=excess_amount, swap_amount=result.optimal_swap_amount, swap_output=result.swap_output, price_impact=price_impact, protocol_liquidity_increase=result.protocol_liquidity_increase)
    @view
    def quote_remove_liquidity_single_token(self, user_address: CallerId, token_a: TokenUid, token_b: TokenUid, token_out: TokenUid, fee: Amount) -> SingleTokenRemovalQuote:
        pool_key = self._get_pool_key(token_a, token_b, fee)
        self._validate_pool_exists(pool_key)
        pool = self.pools[pool_key]
        self._validate_token_in_pool(token_out, pool, 'token_out')
        user_liquidity = self.pool_user_liquidity[pool_key].get(user_address, Amount(0))
        if user_liquidity == 0:
            raise InvalidAction('No liquidity to remove')
        result = self._compute_remove_liquidity_single_token(liquidity_to_remove=user_liquidity, token_out=token_out, reserve_a=pool.reserve_a, reserve_b=pool.reserve_b, token_a=token_a, token_b=token_b, total_liquidity=pool.total_liquidity, fee_numerator=pool.fee_numerator, fee_denominator=pool.fee_denominator, pool_key=pool_key)
        if result.swap_amount > 0:
            if token_out == token_a:
                swap_reserve_in = Amount(pool.reserve_b - result.amount_b)
                swap_reserve_out = Amount(pool.reserve_a - result.amount_a)
                price_impact = self._calculate_single_swap_price_impact(result.swap_amount, result.swap_output, swap_reserve_in, swap_reserve_out)
            else:
                swap_reserve_in = Amount(pool.reserve_a - result.amount_a)
                swap_reserve_out = Amount(pool.reserve_b - result.amount_b)
                price_impact = self._calculate_single_swap_price_impact(result.swap_amount, result.swap_output, swap_reserve_in, swap_reserve_out)
        else:
            price_impact = Amount(0)
        return SingleTokenRemovalQuote(amount_out=result.total_amount_out, token_a_withdrawn=result.amount_a, token_b_withdrawn=result.amount_b, swap_amount=result.swap_amount, swap_output=result.swap_output, price_impact=price_impact, user_liquidity=user_liquidity, protocol_liquidity_increase=result.protocol_liquidity_increase)
    @view
    def quote_remove_liquidity_single_token_percentage(self, user_address: CallerId, pool_key: str, token_out: TokenUid, percentage: Amount) -> SingleTokenRemovalQuote:
        self._validate_pool_exists(pool_key)
        if percentage <= 0 or percentage > 10000:
            raise InvalidAction('Invalid percentage')
        pool = self.pools[pool_key]
        self._validate_token_in_pool(token_out, pool, 'token_out')
        token_a = pool.token_a
        token_b = pool.token_b
        user_liquidity = self.pool_user_liquidity[pool_key].get(user_address, 0)
        if user_liquidity == 0:
            raise InvalidAction('No liquidity to remove')
        liquidity_to_remove = Amount(user_liquidity * percentage // 10000)
        result = self._compute_remove_liquidity_single_token(liquidity_to_remove=liquidity_to_remove, token_out=token_out, reserve_a=pool.reserve_a, reserve_b=pool.reserve_b, token_a=token_a, token_b=token_b, total_liquidity=pool.total_liquidity, fee_numerator=pool.fee_numerator, fee_denominator=pool.fee_denominator, pool_key=pool_key)
        if result.swap_amount > 0:
            if token_out == token_a:
                swap_reserve_in = Amount(pool.reserve_b - result.amount_b)
                swap_reserve_out = Amount(pool.reserve_a - result.amount_a)
                price_impact = self._calculate_single_swap_price_impact(result.swap_amount, result.swap_output, swap_reserve_in, swap_reserve_out)
            else:
                swap_reserve_in = Amount(pool.reserve_a - result.amount_a)
                swap_reserve_out = Amount(pool.reserve_b - result.amount_b)
                price_impact = self._calculate_single_swap_price_impact(result.swap_amount, result.swap_output, swap_reserve_in, swap_reserve_out)
        else:
            price_impact = Amount(0)
        return SingleTokenRemovalQuote(amount_out=result.total_amount_out, token_a_withdrawn=result.amount_a, token_b_withdrawn=result.amount_b, swap_amount=result.swap_amount, swap_output=result.swap_output, price_impact=price_impact, user_liquidity=Amount(user_liquidity), protocol_liquidity_increase=result.protocol_liquidity_increase)
    @view
    def front_quote_add_liquidity_out(self, amount_out: Amount, token_in: TokenUid, pool_key: str) -> Amount:
        if pool_key not in self.pools:
            raise PoolNotFound()
        pool = self.pools[pool_key]
        reserve_a = pool.reserve_a
        reserve_b = pool.reserve_b
        token_a = pool.token_a
        if token_in == token_a:
            quote = self.quote(amount_out, reserve_b, reserve_a)
        else:
            assert token_in == pool.token_b, f'Token {token_in} is not part of pool {pool_key}'
            quote = self.quote(amount_out, reserve_a, reserve_b)
        return quote
    def _get_protocol_liquidity_increase(self, protocol_fee_amount: Amount, token: TokenUid, pool_key: str) -> Amount:
        pool = self.pools[pool_key]
        if token == pool.token_a:
            product_after = Amount((pool.reserve_a + protocol_fee_amount) * pool.reserve_b)
            product_before = Amount(pool.reserve_a * pool.reserve_b)
        else:
            assert token == pool.token_b, f'Token {token} is not part of pool {pool_key}'
            product_after = Amount(pool.reserve_a * (pool.reserve_b + protocol_fee_amount))
            product_before = Amount(pool.reserve_a * pool.reserve_b)
        sqrt_after = self._isqrt(product_after)
        sqrt_before = self._isqrt(product_before)
        delta_sqrt = sqrt_after - sqrt_before
        liquidity_increase = delta_sqrt * PRECISION
        return Amount(liquidity_increase)
    @public(allow_deposit=True)
    def create_pool(self, ctx: Context, fee: Amount) -> str:
        self._check_not_paused(ctx)
        token_a, token_b = set(ctx.actions.keys())
        if token_a == token_b:
            raise InvalidTokens('token_a cannot be equal to token_b')
        token_a, token_b = self._order_tokens(token_a, token_b)
        for token in (token_a, token_b):
            reserver = self.reserved_pools.get(token)
            if reserver is not None and reserver != ctx.caller_id:
                raise Unauthorized('Pool creation is reserved for this token')
        pool_key = self._get_pool_key(token_a, token_b, fee)
        self.log.debug('creating pool', token_a=token_a.hex(), token_b=token_b.hex(), fee=fee)
        if pool_key in self.pools:
            raise PoolExists('Pool already exists')
        if fee > 50:
            raise InvalidFee('Fee too high')
        if fee < 0:
            raise InvalidFee('Invalid fee')
        if set(ctx.actions.keys()) != {token_a, token_b}:
            raise InvalidTokens('Only token_a and token_b are allowed')
        action_a = self._get_deposit_action(ctx, token_a)
        action_b = self._get_deposit_action(ctx, token_b)
        action_a_amount = Amount(action_a.amount)
        action_b_amount = Amount(action_b.amount)
        product = Amount(action_a_amount * action_b_amount)
        initial_liquidity = self._isqrt(product) * PRECISION
        minimum_liquidity = self._isqrt(product) * MINIMUM_LIQUIDITY
        total_liquidity = initial_liquidity + minimum_liquidity
        assert initial_liquidity > 0, 'Insufficient initial liquidity: amounts too small'
        self.log.debug('initial liquidity calculated', product=product, initial_liquidity=initial_liquidity, minimum_liquidity=minimum_liquidity, total_liquidity=total_liquidity)
        initial_price_a = action_b_amount * PRICE_PRECISION // action_a_amount
        initial_price_b = action_a_amount * PRICE_PRECISION // action_b_amount
        self.pools[pool_key] = PoolState(token_a=token_a, token_b=token_b, reserve_a=action_a_amount, reserve_b=action_b_amount, fee_numerator=fee, fee_denominator=Amount(1000), total_liquidity=Amount(total_liquidity), total_change_a=Amount(0), total_change_b=Amount(0), transactions=Amount(0), last_activity=Timestamp(ctx.block.timestamp), volume_a=Amount(0), volume_b=Amount(0), price_a_window_sum=Amount(initial_price_a * self.default_twap_window), price_b_window_sum=Amount(initial_price_b * self.default_twap_window), block_timestamp_last=int(ctx.block.timestamp), twap_window=self.default_twap_window)
        self.pool_user_liquidity[pool_key] = {ctx.caller_id: Amount(initial_liquidity)}
        self.pool_change[pool_key] = {}
        self.pool_accumulated_fee[pool_key] = {token_a: Amount(0), token_b: Amount(0)}
        self.pool_user_deposit_price_usd[pool_key] = {}
        self.pool_user_last_action_timestamp[pool_key] = {}
        self.all_pools.append(pool_key)
        if token_a in self.token_to_pools:
            self.token_to_pools[token_a].append(pool_key)
        else:
            self.token_to_pools[token_a] = [pool_key]
        if token_b in self.token_to_pools:
            self.token_to_pools[token_b].append(pool_key)
        else:
            self.token_to_pools[token_b] = [pool_key]
        if token_a == HATHOR_TOKEN_UID or token_b == HATHOR_TOKEN_UID:
            other_token = token_b if token_a == HATHOR_TOKEN_UID else token_a
            current_pool_key = self.htr_token_map.get(other_token)
            if current_pool_key is None or self.pools[pool_key].fee_numerator < self.pools[current_pool_key].fee_numerator:
                self.htr_token_map[other_token] = pool_key
                self.log.debug('updating htr token map for pool', pool_key=pool_key, other_token=other_token.hex(), fee_numerator=fee)
        self.log.info('pool created successfully', pool_key=pool_key, token_a=token_a.hex(), token_b=token_b.hex(), initial_reserve_a=action_a_amount, initial_reserve_b=action_b_amount, user_liquidity=initial_liquidity, fee_numerator=fee)
        return pool_key
    @public(allow_deposit=True)
    def add_liquidity(self, ctx: Context, fee: Amount) -> tuple[TokenUid, Amount]:
        self._check_not_paused(ctx)
        pool_key, pool, user_address = self._setup_pool_from_context(ctx, fee)
        self._update_twap(pool_key, ctx)
        action_a, action_b = self._get_actions_in_in(ctx, pool_key)
        reserve_a = pool.reserve_a
        reserve_b = pool.reserve_b
        action_a_amount = Amount(action_a.amount)
        action_b_amount = Amount(action_b.amount)
        self.log.debug('adding liquidity', pool_key=pool_key, action_a_amount=action_a_amount, action_b_amount=action_b_amount, user=str(user_address))
        optimal_b = self.quote(action_a_amount, reserve_a, reserve_b)
        if optimal_b <= action_b_amount:
            change = action_b_amount - optimal_b
            self._update_change(user_address, change, pool.token_b, pool_key)
            pool = self.pools[pool_key]
            self.log.debug('token a is limiting factor', optimal_b=optimal_b, action_b_amount=action_b_amount, change=change)
            liquidity_increase = pool.total_liquidity * action_a_amount // reserve_a
            self.log.debug('liquidity increase calculated', liquidity_increase=liquidity_increase, total_liquidity_before=pool.total_liquidity, total_liquidity_after=pool.total_liquidity + liquidity_increase)
            self._update_user_liquidity(pool_key, user_address, Amount(liquidity_increase))
            self._update_pool(pool_key, total_liquidity=Amount(pool.total_liquidity + liquidity_increase), reserve_a=Amount(pool.reserve_a + action_a_amount), reserve_b=Amount(pool.reserve_b + optimal_b), last_activity=Timestamp(ctx.block.timestamp))
            self._update_user_profit_tracking(user_address, pool_key, ctx)
            pool_after = self.pools[pool_key]
            self._check_price_ratio(reserve_a, reserve_b, pool_after.reserve_a, pool_after.reserve_b, 'add_liquidity')
            self.log.info('liquidity added successfully', pool_key=pool_key, user=str(user_address), liquidity_increase=liquidity_increase, reserve_a_added=action_a_amount, reserve_b_added=optimal_b, change_token='token_b', change_amount=change)
            return (pool.token_b, change)
        else:
            optimal_a = self.quote(action_b_amount, reserve_b, reserve_a)
            if optimal_a > action_a_amount:
                raise InvalidAction('Insufficient token A amount')
            change = action_a_amount - optimal_a
            self._update_change(user_address, change, pool.token_a, pool_key)
            pool = self.pools[pool_key]
            self.log.debug('token b is limiting factor', optimal_a=optimal_a, action_a_amount=action_a_amount, change=change)
            liquidity_increase = pool.total_liquidity * optimal_a // reserve_a
            self.log.debug('liquidity increase calculated', liquidity_increase=liquidity_increase, total_liquidity_before=pool.total_liquidity, total_liquidity_after=pool.total_liquidity + liquidity_increase)
            self._update_user_liquidity(pool_key, user_address, liquidity_increase)
            self._update_pool(pool_key, total_liquidity=Amount(pool.total_liquidity + liquidity_increase), reserve_a=Amount(pool.reserve_a + optimal_a), reserve_b=Amount(pool.reserve_b + action_b_amount), last_activity=Timestamp(ctx.block.timestamp))
            self._update_user_profit_tracking(user_address, pool_key, ctx)
            pool_after = self.pools[pool_key]
            self._check_price_ratio(reserve_a, reserve_b, pool_after.reserve_a, pool_after.reserve_b, 'add_liquidity')
            self.log.info('liquidity added successfully', pool_key=pool_key, user=str(user_address), liquidity_increase=liquidity_increase, reserve_a_added=optimal_a, reserve_b_added=action_b_amount, change_token='token_a', change_amount=change)
            return (pool.token_a, change)
    @public(allow_withdrawal=True)
    def remove_liquidity(self, ctx: Context, fee: Amount) -> tuple[TokenUid, Amount]:
        self._check_not_paused(ctx)
        pool_key, pool, user_address = self._setup_pool_from_context(ctx, fee)
        self._update_twap(pool_key, ctx)
        reserve_a_before = pool.reserve_a
        reserve_b_before = pool.reserve_b
        action_a, action_b = self._get_actions_out_out(ctx, pool_key)
        action_a_amount = Amount(action_a.amount)
        action_b_amount = Amount(action_b.amount)
        self.log.debug('removing liquidity', pool_key=pool_key, user=str(user_address), action_a_amount=action_a_amount, action_b_amount=action_b_amount, reserve_a_before=reserve_a_before, reserve_b_before=reserve_b_before)
        user_liquidity = self.pool_user_liquidity[pool_key]
        if user_address not in user_liquidity or user_liquidity[user_address] == 0:
            raise InvalidAction('No liquidity to remove')
        max_withdraw = user_liquidity[user_address] * pool.reserve_a // pool.total_liquidity
        self.log.debug('max withdrawal calculated', user_liquidity=user_liquidity[user_address], max_withdraw=max_withdraw, action_a_amount=action_a_amount)
        if max_withdraw < action_a_amount:
            raise InvalidAction(f'Insufficient liquidity: {max_withdraw} < {action_a_amount}')
        optimal_b = self.quote(action_a_amount, pool.reserve_a, pool.reserve_b)
        if optimal_b < action_b_amount:
            raise InvalidAction('Insufficient token B amount')
        change = optimal_b - action_b_amount
        self._update_change(user_address, change, pool.token_b, pool_key)
        pool = self.pools[pool_key]
        liquidity_decrease = self._ceil_div(Amount(pool.total_liquidity * action_a_amount), pool.reserve_a)
        self.log.debug('liquidity decrease calculated', liquidity_decrease=liquidity_decrease, total_liquidity_before=pool.total_liquidity, total_liquidity_after=pool.total_liquidity - liquidity_decrease)
        self._update_user_liquidity(pool_key, user_address, Amount(-liquidity_decrease))
        self._update_pool(pool_key, total_liquidity=Amount(pool.total_liquidity - liquidity_decrease), reserve_a=Amount(pool.reserve_a - action_a_amount), reserve_b=Amount(pool.reserve_b - optimal_b), last_activity=Timestamp(ctx.block.timestamp))
        self._update_user_profit_tracking(user_address, pool_key, ctx)
        pool_after = self.pools[pool_key]
        self._check_price_ratio(reserve_a_before, reserve_b_before, pool_after.reserve_a, pool_after.reserve_b, 'remove_liquidity')
        self.log.info('liquidity removed successfully', pool_key=pool_key, user=str(user_address), liquidity_decrease=liquidity_decrease, amount_a_withdrawn=action_a_amount, amount_b_withdrawn=optimal_b, change_b=change)
        return (pool.token_b, change)
    @public(allow_deposit=True)
    def add_liquidity_single_token(self, ctx: Context, token_out: TokenUid, fee: Amount) -> tuple[TokenUid, Amount]:
        self._check_not_paused(ctx)
        if len(ctx.actions) != 1:
            raise InvalidAction('Must provide exactly one token deposit')
        token_in = list(ctx.actions.keys())[0]
        deposit_action = self._get_deposit_action(ctx, token_in)
        amount_in = Amount(deposit_action.amount)
        user_address = ctx.caller_id
        self.log.debug('adding liquidity with single token', token_in=token_in.hex(), amount_in=amount_in, token_out=token_out.hex(), user=str(user_address))
        if token_in == token_out:
            raise InvalidTokens('Input and output tokens cannot be the same')
        if token_in > token_out:
            token_a, token_b = (token_out, token_in)
        else:
            token_a, token_b = (token_in, token_out)
        pool_key = self._get_pool_key(token_a, token_b, fee)
        self._validate_pool_exists(pool_key)
        self._update_twap(pool_key, ctx)
        pool = self.pools[pool_key]
        assert set([token_in, token_out]) == set([pool.token_a, pool.token_b]), 'Tokens must match pool tokens'
        k_before_swap = Amount(pool.reserve_a * pool.reserve_b)
        self.log.debug('computing single token liquidity addition', k_before_swap=k_before_swap, reserve_a=pool.reserve_a, reserve_b=pool.reserve_b)
        result = self._compute_add_liquidity_single_token(amount_in=amount_in, token_in=token_in, reserve_a=pool.reserve_a, reserve_b=pool.reserve_b, token_a=token_a, token_b=token_b, total_liquidity=pool.total_liquidity, fee_numerator=pool.fee_numerator, fee_denominator=pool.fee_denominator, pool_key=pool_key)
        reserve_in, reserve_out, _ = self._resolve_token_direction(pool, token_in)
        price_impact = self._calculate_single_swap_price_impact(result.optimal_swap_amount, result.swap_output, reserve_in, reserve_out)
        self.log.debug('internal swap price impact calculated', optimal_swap_amount=result.optimal_swap_amount, swap_output=result.swap_output, price_impact=price_impact, max_allowed=MAX_PRICE_IMPACT)
        if price_impact > MAX_PRICE_IMPACT:
            self.log.warn('price impact too high', price_impact=price_impact, max_allowed=MAX_PRICE_IMPACT, optimal_swap_amount=result.optimal_swap_amount)
            raise InvalidAction('Price impact too high - internal swap exceeds 5% impact')
        if result.optimal_swap_amount > 0:
            actual_liquidity_increase = self._process_swap_fees(pool_key=pool_key, token_in=token_in, amount_in=result.optimal_swap_amount, fee_numerator=pool.fee_numerator, fee_denominator=pool.fee_denominator)
        pool = self.pools[pool_key]
        self._update_pool(pool_key, reserve_a=result.reserve_a_after_swap, reserve_b=result.reserve_b_after_swap)
        pool = self.pools[pool_key]
        k_after_swap = Amount(pool.reserve_a * pool.reserve_b)
        self._check_k_not_decreased(k_before_swap, k_after_swap, 'add_liquidity_single_token (internal swap)')
        self.log.debug('k invariant maintained after internal swap', k_before_swap=k_before_swap, k_after_swap=k_after_swap, k_increase=k_after_swap - k_before_swap)
        self._update_user_liquidity(pool_key, user_address, result.liquidity_increase)
        final_reserve_a = Amount(result.reserve_a_after_swap + result.actual_a)
        final_reserve_b = Amount(result.reserve_b_after_swap + result.actual_b)
        self._check_price_ratio(result.reserve_a_after_swap, result.reserve_b_after_swap, final_reserve_a, final_reserve_b, 'add_liquidity_single_token')
        pool = self.pools[pool_key]
        volume_a_increment, volume_b_increment = self._get_volume_increments(token_in, result.optimal_swap_amount, result.swap_output, pool)
        self._update_pool(pool_key, total_liquidity=Amount(pool.total_liquidity + result.liquidity_increase), reserve_a=final_reserve_a, reserve_b=final_reserve_b, transactions=Amount(pool.transactions + 1), volume_a=Amount(pool.volume_a + volume_a_increment), volume_b=Amount(pool.volume_b + volume_b_increment), last_activity=Timestamp(ctx.block.timestamp))
        if result.excess_a > 0:
            self._update_change(user_address, result.excess_a, token_a, pool_key)
        if result.excess_b > 0:
            self._update_change(user_address, result.excess_b, token_b, pool_key)
        self._update_user_profit_tracking(user_address, pool_key, ctx)
        self.log.info('single token liquidity added successfully', pool_key=pool_key, user=str(user_address), token_in=token_in.hex(), amount_in=amount_in, liquidity_increase=result.liquidity_increase, optimal_swap_amount=result.optimal_swap_amount, swap_output=result.swap_output, excess_a=result.excess_a, excess_b=result.excess_b, protocol_liquidity=result.protocol_liquidity_increase)
        if result.excess_a > 0:
            return (token_a, result.excess_a)
        elif result.excess_b > 0:
            return (token_b, result.excess_b)
        else:
            return (token_in, Amount(0))
    def _isqrt(self, n: Amount) -> Amount:
        assert n >= 0, 'Cannot calculate square root of negative number'
        if n == 0:
            return Amount(0)
        if n <= 3:
            return Amount(1)
        if n > 1 << 128:
            bit_length = n.bit_length()
            x = Amount(1 << (bit_length + 1) // 2)
            z = Amount(n)
        else:
            z = Amount(n)
            x = Amount(n // 2 + 1)
        max_iterations = 200
        for iteration in range(max_iterations):
            if x >= z:
                return Amount(z)
            z = x
            x = Amount((n // x + x) // 2)
        raise InvalidState(f'Square root calculation did not converge after {max_iterations} iterations')
    def _calculate_optimal_swap_amount(self, amount_in: Amount, reserve_in: Amount, fee: Amount) -> Amount:
        fee_denominator = Amount(1000)
        if fee >= fee_denominator:
            return Amount(0)
        if amount_in == 0 or reserve_in == 0:
            return Amount(0)
        fee_multiplier = Amount(fee_denominator - fee)
        term1 = reserve_in * fee_denominator * fee_denominator
        term2 = amount_in * fee_denominator * fee_multiplier
        under_sqrt = Amount(reserve_in * (term1 + term2))
        sqrt_k = self._isqrt(under_sqrt)
        numerator = Amount(sqrt_k - reserve_in * fee_denominator)
        if numerator <= 0:
            return Amount(0)
        optimal = Amount(numerator // fee_multiplier)
        if optimal > amount_in:
            raise InvalidState(f'Calculated optimal swap amount {optimal} exceeds input amount {amount_in}')
        return optimal
    def _compute_add_liquidity_single_token(self, amount_in: Amount, token_in: TokenUid, reserve_a: Amount, reserve_b: Amount, token_a: TokenUid, token_b: TokenUid, total_liquidity: Amount, fee_numerator: Amount, fee_denominator: Amount, pool_key: str) -> _AddLiquiditySingleTokenResult:
        if token_in == token_a:
            reserve_in = reserve_a
            reserve_out = reserve_b
        else:
            assert token_in == token_b, f'Token {token_in} is not part of pool'
            reserve_in = reserve_b
            reserve_out = reserve_a
        fee = Amount(fee_numerator * 1000 // fee_denominator if fee_denominator > 0 else Amount(0))
        optimal_swap_amount = self._calculate_optimal_swap_amount(amount_in, reserve_in, fee)
        swap_output = self.get_amount_out(optimal_swap_amount, reserve_in, reserve_out, fee_numerator, fee_denominator)
        if optimal_swap_amount > 0:
            fee_amount, protocol_liquidity_increase = self._simulate_swap_fees(pool_key=pool_key, token_in=token_in, amount_in=optimal_swap_amount, fee_numerator=fee_numerator, fee_denominator=fee_denominator, current_total_liquidity=total_liquidity)
        else:
            protocol_liquidity_increase = Amount(0)
        total_liquidity_after_swap = Amount(total_liquidity + protocol_liquidity_increase)
        if token_in == token_a:
            reserve_a_after_swap = Amount(reserve_a + optimal_swap_amount)
            reserve_b_after_swap = Amount(reserve_b - swap_output)
            token_a_amount = amount_in - optimal_swap_amount
            token_b_amount = swap_output
        else:
            reserve_a_after_swap = Amount(reserve_a - swap_output)
            reserve_b_after_swap = Amount(reserve_b + optimal_swap_amount)
            token_b_amount = amount_in - optimal_swap_amount
            token_a_amount = swap_output
        assert total_liquidity > 0, 'Pool must have liquidity (initial burn prevents zero liquidity)'
        assert reserve_a_after_swap > 0 and reserve_b_after_swap > 0, 'Reserves must be non-zero'
        optimal_b_for_a = self.quote(token_a_amount, reserve_a_after_swap, reserve_b_after_swap)
        optimal_a_for_b = self.quote(token_b_amount, reserve_b_after_swap, reserve_a_after_swap)
        if optimal_b_for_a <= token_b_amount:
            actual_a = token_a_amount
            actual_b = optimal_b_for_a
            liquidity_increase = total_liquidity_after_swap * actual_a // reserve_a_after_swap
        else:
            actual_b = token_b_amount
            actual_a = optimal_a_for_b
            liquidity_increase = total_liquidity_after_swap * actual_b // reserve_b_after_swap
        liquidity_increase = Amount(liquidity_increase)
        excess_a = Amount(token_a_amount - actual_a)
        excess_b = Amount(token_b_amount - actual_b)
        assert excess_a == 0 or excess_b == 0, 'Both excess amounts cannot be non-zero'
        return _AddLiquiditySingleTokenResult(optimal_swap_amount=optimal_swap_amount, swap_output=swap_output, reserve_a_after_swap=reserve_a_after_swap, reserve_b_after_swap=reserve_b_after_swap, token_a_amount=Amount(token_a_amount), token_b_amount=Amount(token_b_amount), liquidity_increase=liquidity_increase, actual_a=Amount(actual_a), actual_b=Amount(actual_b), excess_a=excess_a, excess_b=excess_b, protocol_liquidity_increase=protocol_liquidity_increase)
    def _compute_remove_liquidity_single_token(self, liquidity_to_remove: Amount, token_out: TokenUid, reserve_a: Amount, reserve_b: Amount, token_a: TokenUid, token_b: TokenUid, total_liquidity: Amount, fee_numerator: Amount, fee_denominator: Amount, pool_key: str) -> _RemoveLiquiditySingleTokenResult:
        assert total_liquidity > 0, 'Pool must have liquidity (initial burn prevents zero liquidity)'
        assert reserve_a > 0 and reserve_b > 0, 'Reserves must be non-zero'
        amount_a = Amount(reserve_a * liquidity_to_remove // total_liquidity)
        amount_b = Amount(reserve_b * liquidity_to_remove // total_liquidity)
        new_reserve_a = Amount(reserve_a - amount_a)
        new_reserve_b = Amount(reserve_b - amount_b)
        current_total_liquidity = Amount(total_liquidity - liquidity_to_remove)
        if token_out == token_a:
            if amount_b > 0:
                swap_reserve_in = new_reserve_b
                swap_reserve_out = Amount(new_reserve_a)
                extra_a = self.get_amount_out(amount_b, swap_reserve_in, swap_reserve_out, fee_numerator, fee_denominator)
                total_amount_out = amount_a + extra_a
                swap_amount = amount_b
                swap_output = extra_a
                reserve_a_after = Amount(new_reserve_a - extra_a)
                reserve_b_after = Amount(new_reserve_b + amount_b)
                fee_amount, protocol_liquidity_increase = self._simulate_swap_fees(pool_key=pool_key, token_in=token_b, amount_in=swap_amount, fee_numerator=fee_numerator, fee_denominator=fee_denominator, current_total_liquidity=current_total_liquidity)
            else:
                total_amount_out = amount_a
                swap_amount = Amount(0)
                swap_output = Amount(0)
                reserve_a_after = new_reserve_a
                reserve_b_after = new_reserve_b
                protocol_liquidity_increase = Amount(0)
        else:
            assert token_out == token_b, f'Token {token_out} is not part of pool'
            if amount_a > 0:
                swap_reserve_in = new_reserve_a
                swap_reserve_out = Amount(new_reserve_b)
                extra_b = self.get_amount_out(amount_a, swap_reserve_in, swap_reserve_out, fee_numerator, fee_denominator)
                total_amount_out = amount_b + extra_b
                swap_amount = amount_a
                swap_output = extra_b
                reserve_a_after = Amount(new_reserve_a + amount_a)
                reserve_b_after = Amount(new_reserve_b - extra_b)
                fee_amount, protocol_liquidity_increase = self._simulate_swap_fees(pool_key=pool_key, token_in=token_a, amount_in=swap_amount, fee_numerator=fee_numerator, fee_denominator=fee_denominator, current_total_liquidity=current_total_liquidity)
            else:
                total_amount_out = amount_b
                swap_amount = Amount(0)
                swap_output = Amount(0)
                reserve_a_after = new_reserve_a
                reserve_b_after = new_reserve_b
                protocol_liquidity_increase = Amount(0)
        return _RemoveLiquiditySingleTokenResult(amount_a=amount_a, amount_b=amount_b, swap_amount=swap_amount, swap_output=swap_output, total_amount_out=total_amount_out, reserve_a_after=reserve_a_after, reserve_b_after=reserve_b_after, protocol_liquidity_increase=protocol_liquidity_increase)
    def _calculate_single_swap_price_impact(self, amount_in: Amount, amount_out: Amount, reserve_in: Amount, reserve_out: Amount) -> Amount:
        if amount_in == 0 or amount_out == 0 or reserve_in == 0 or (reserve_out == 0):
            return Amount(0)
        numerator = amount_out * reserve_in
        denominator = amount_in * reserve_out
        if denominator == 0 or numerator >= denominator:
            return Amount(0)
        price_impact = (denominator - numerator) * 10000 // denominator
        return Amount(price_impact)
    def _calculate_value_based_price_impact(self, amount_in: Amount, token_in: TokenUid, actual_a: Amount, actual_b: Amount, token_a: TokenUid, token_b: TokenUid) -> Amount:
        token_in_price = self.get_token_price_in_usd(token_in)
        token_a_price = self.get_token_price_in_usd(token_a)
        token_b_price = self.get_token_price_in_usd(token_b)
        if token_in_price == 0:
            return Amount(0)
        input_value_usd = amount_in * token_in_price // 100000000
        value_a_usd = actual_a * token_a_price // 100000000
        value_b_usd = actual_b * token_b_price // 100000000
        output_value_usd = Amount(value_a_usd + value_b_usd)
        if input_value_usd == 0:
            return Amount(0)
        if output_value_usd >= input_value_usd:
            return Amount(0)
        price_impact = Amount((input_value_usd - output_value_usd) * 10000 // input_value_usd)
        return price_impact
    @public(allow_withdrawal=True)
    def remove_liquidity_single_token(self, ctx: Context, pool_key: str, percentage: Amount) -> Amount:
        self._check_not_paused(ctx)
        self._validate_pool_exists(pool_key)
        self._update_twap(pool_key, ctx)
        user_address = ctx.caller_id
        if percentage <= 0 or percentage > 10000:
            raise InvalidAction('Invalid percentage')
        self.log.debug('removing liquidity single token', pool_key=pool_key, user=str(user_address), percentage=percentage)
        if len(ctx.actions) != 1:
            raise InvalidAction('Must provide exactly one token withdrawal')
        token_out = list(ctx.actions.keys())[0]
        withdrawal_action = self._get_withdrawal_action(ctx, token_out)
        withdrawal_amount = withdrawal_action.amount
        pool = self.pools[pool_key]
        self._validate_token_in_pool(token_out, pool, 'token_out')
        token_a = pool.token_a
        token_b = pool.token_b
        pool_user_liquidity = self.pool_user_liquidity[pool_key]
        user_liquidity = pool_user_liquidity.get(user_address, 0)
        if user_liquidity == 0:
            raise InvalidAction('No liquidity to remove')
        liquidity_to_remove = Amount(user_liquidity * percentage // 10000)
        self.log.debug('liquidity to remove calculated', user_liquidity=user_liquidity, percentage=percentage, liquidity_to_remove=liquidity_to_remove)
        reserve_a_before = pool.reserve_a
        reserve_b_before = pool.reserve_b
        result = self._compute_remove_liquidity_single_token(liquidity_to_remove=liquidity_to_remove, token_out=token_out, reserve_a=pool.reserve_a, reserve_b=pool.reserve_b, token_a=token_a, token_b=token_b, total_liquidity=pool.total_liquidity, fee_numerator=pool.fee_numerator, fee_denominator=pool.fee_denominator, pool_key=pool_key)
        self.log.debug('single token removal computed', amount_a=result.amount_a, amount_b=result.amount_b, swap_amount=result.swap_amount, swap_output=result.swap_output, total_amount_out=result.total_amount_out, protocol_liquidity=result.protocol_liquidity_increase)
        self._update_user_liquidity(pool_key, user_address, Amount(-liquidity_to_remove))
        reserve_a_after_removal = Amount(pool.reserve_a - result.amount_a)
        reserve_b_after_removal = Amount(pool.reserve_b - result.amount_b)
        self._update_pool(pool_key, total_liquidity=Amount(pool.total_liquidity - liquidity_to_remove), reserve_a=reserve_a_after_removal, reserve_b=reserve_b_after_removal)
        self._check_price_ratio(reserve_a_before, reserve_b_before, reserve_a_after_removal, reserve_b_after_removal, 'remove_liquidity_single_token (liquidity removal)')
        k_before_swap = Amount(reserve_a_after_removal * reserve_b_after_removal)
        if result.swap_amount > 0:
            if token_out == token_a:
                swap_reserve_in = reserve_b_after_removal
                swap_reserve_out = reserve_a_after_removal
                token_in_for_swap = token_b
            else:
                swap_reserve_in = reserve_a_after_removal
                swap_reserve_out = reserve_b_after_removal
                token_in_for_swap = token_a
            price_impact = self._calculate_single_swap_price_impact(result.swap_amount, result.swap_output, swap_reserve_in, swap_reserve_out)
            self.log.debug('internal swap price impact', swap_amount=result.swap_amount, swap_output=result.swap_output, price_impact=price_impact, max_allowed=MAX_PRICE_IMPACT)
            if price_impact > MAX_PRICE_IMPACT:
                self.log.warn('price impact exceeds maximum', price_impact=price_impact, max_allowed=MAX_PRICE_IMPACT)
                raise InvalidAction('Price impact too high - internal swap exceeds 5% impact')
            actual_liquidity_increase = self._process_swap_fees(pool_key=pool_key, token_in=token_in_for_swap, amount_in=result.swap_amount, fee_numerator=pool.fee_numerator, fee_denominator=pool.fee_denominator)
        pool = self.pools[pool_key]
        self._update_pool(pool_key, reserve_a=result.reserve_a_after, reserve_b=result.reserve_b_after)
        pool = self.pools[pool_key]
        k_after_swap = Amount(pool.reserve_a * pool.reserve_b)
        self._check_k_not_decreased(k_before_swap, k_after_swap, 'remove_liquidity_single_token (internal swap)')
        total_amount_out = result.total_amount_out
        if withdrawal_amount < total_amount_out:
            excess = Amount(total_amount_out - withdrawal_amount)
            self._update_change(user_address, excess, token_out, pool_key)
            self.log.debug('handling withdrawal slippage', withdrawal_amount=withdrawal_amount, total_amount_out=total_amount_out, excess=excess)
            total_amount_out = withdrawal_amount
        elif withdrawal_amount > total_amount_out:
            raise InvalidAction('Insufficient output amount')
        pool = self.pools[pool_key]
        if result.swap_amount > 0:
            swap_token_in = token_b if token_out == token_a else token_a
            volume_a_increment, volume_b_increment = self._get_volume_increments(swap_token_in, result.swap_amount, result.swap_output, pool)
        else:
            volume_a_increment, volume_b_increment = (Amount(0), Amount(0))
        self._update_pool(pool_key, transactions=Amount(pool.transactions + 1), volume_a=Amount(pool.volume_a + volume_a_increment), volume_b=Amount(pool.volume_b + volume_b_increment), last_activity=Timestamp(ctx.block.timestamp))
        self._update_user_profit_tracking(user_address, pool_key, ctx)
        self.log.info('single token liquidity removed successfully', pool_key=pool_key, user=str(user_address), percentage=percentage, liquidity_removed=liquidity_to_remove, token_out=token_out.hex(), amount_out=total_amount_out, swap_amount=result.swap_amount, protocol_liquidity=result.protocol_liquidity_increase)
        return Amount(total_amount_out)
    @public(allow_withdrawal=True, allow_deposit=True)
    def swap_exact_tokens_for_tokens(self, ctx: Context, fee: Amount, deadline: Timestamp) -> SwapResult:
        self._check_not_paused(ctx)
        assert ctx.block.timestamp <= deadline, f'Transaction expired: block timestamp {ctx.block.timestamp} > deadline {deadline}'
        token_a, token_b = set(ctx.actions.keys())
        user_address = ctx.caller_id
        token_a, token_b = self._order_tokens(token_a, token_b)
        pool_key = self._get_pool_key(token_a, token_b, fee)
        self._validate_pool_exists(pool_key)
        pool = self.pools[pool_key]
        action_in, action_out = self._get_actions_in_out(ctx, pool_key)
        action_in_amount = Amount(action_in.amount)
        min_accepted_amount = Amount(action_out.amount)
        self.log.debug('swap exact tokens for tokens', pool_key=pool_key, user=str(user_address), token_in=action_in.token_uid.hex(), token_out=action_out.token_uid.hex(), amount_in=action_in_amount, min_accepted_amount=min_accepted_amount, deadline=deadline)
        amount_in = action_in_amount
        amount_out = self._swap(amount_in, action_in.token_uid, pool_key, ctx)
        if min_accepted_amount > amount_out:
            raise InvalidAction('Amount out is too high')
        change_in = Amount(amount_out - min_accepted_amount)
        self._update_change(user_address, change_in, action_out.token_uid, pool_key)
        self.log.info('swap executed successfully', pool_key=pool_key, user=str(user_address), token_in=action_in.token_uid.hex(), token_out=action_out.token_uid.hex(), amount_in=action_in_amount, amount_out=amount_out, slippage=change_in)
        return SwapResult(action_in_amount, change_in, action_in.token_uid, amount_out, action_out.token_uid)
    @public(allow_withdrawal=True, allow_deposit=True)
    def swap_tokens_for_exact_tokens(self, ctx: Context, fee: Amount, deadline: Timestamp) -> SwapResult:
        self._check_not_paused(ctx)
        assert ctx.block.timestamp <= deadline, f'Transaction expired: block timestamp {ctx.block.timestamp} > deadline {deadline}'
        token_a, token_b = set(ctx.actions.keys())
        user_address = ctx.caller_id
        token_a, token_b = self._order_tokens(token_a, token_b)
        pool_key = self._get_pool_key(token_a, token_b, fee)
        self._validate_pool_exists(pool_key)
        pool = self.pools[pool_key]
        action_in, action_out = self._get_actions_in_out(ctx, pool_key)
        reserve_in, reserve_out, _ = self._resolve_token_direction(pool, action_in.token_uid)
        action_in_amount = Amount(action_in.amount)
        amount_out = Amount(action_out.amount)
        if reserve_out <= amount_out:
            raise InsufficientLiquidity('Insufficient liquidity')
        amount_in = self.get_amount_in(amount_out, reserve_in, reserve_out, pool.fee_numerator, pool.fee_denominator)
        if action_in_amount < amount_in:
            raise InvalidAction('Amount in is too low')
        change_in = action_in_amount - amount_in
        self._update_change(user_address, change_in, action_in.token_uid, pool_key)
        self._swap_exact_out(amount_in, action_in.token_uid, amount_out, pool_key, ctx)
        return SwapResult(action_in_amount, change_in, action_in.token_uid, amount_out, action_out.token_uid)
    def _validate_path_pools_signed(self, path: list[str]) -> None:
        seen: list[str] = []
        for pool_key in path:
            if pool_key not in self.pools:
                raise PoolNotFound()
            if pool_key not in self.pool_signers:
                raise InvalidPath('Route contains an unsigned pool')
            if pool_key in seen:
                raise InvalidPath('Route contains a duplicate pool')
            seen.append(pool_key)
    @public(allow_withdrawal=True, allow_deposit=True)
    def swap_exact_tokens_for_tokens_through_path(self, ctx: Context, path_str: str, deadline: Timestamp) -> SwapResult:
        self._check_not_paused(ctx)
        assert ctx.block.timestamp <= deadline, f'Transaction expired: block timestamp {ctx.block.timestamp} > deadline {deadline}'
        user_address = ctx.caller_id
        if not path_str:
            raise InvalidPath('Empty path')
        path = path_str.split(',')
        if len(path) == 0 or len(path) > 3:
            raise InvalidPath('Invalid path length')
        self._validate_path_pools_signed(path)
        deposit_action, withdrawal_action = self._get_deposit_and_withdrawal_actions(ctx)
        amount_in = deposit_action.amount
        token_in = deposit_action.token_uid
        first_pool_key = path[0]
        if first_pool_key not in self.pools:
            raise PoolNotFound()
        current_amount = Amount(amount_in)
        current_token = token_in
        first_pool = self.pools[first_pool_key]
        next_token = self._get_other_token(first_pool, current_token)
        first_amount_out = self._swap(current_amount, current_token, first_pool_key, ctx)
        if len(path) == 1:
            token_out = next_token
            amount_out = first_amount_out
        else:
            current_amount = first_amount_out
            current_token = next_token
            second_pool_key = path[1]
            if second_pool_key not in self.pools:
                raise PoolNotFound()
            second_pool = self.pools[second_pool_key]
            next_token = self._get_other_token(second_pool, current_token)
            second_amount_out = self._swap(current_amount, current_token, second_pool_key, ctx)
            if len(path) == 2:
                token_out = next_token
                amount_out = second_amount_out
            else:
                current_amount = second_amount_out
                current_token = next_token
                third_pool_key = path[2]
                if third_pool_key not in self.pools:
                    raise PoolNotFound()
                third_pool = self.pools[third_pool_key]
                next_token = self._get_other_token(third_pool, current_token)
                third_amount_out = self._swap(current_amount, current_token, third_pool_key, ctx)
                token_out = next_token
                amount_out = third_amount_out
        if withdrawal_action.token_uid != token_out:
            raise InvalidAction('Withdrawal token does not match output token')
        if withdrawal_action.amount > amount_out:
            raise InvalidAction('Withdrawal amount exceeds swap output')
        slippage_out = 0
        if withdrawal_action.amount < amount_out:
            slippage_out = Amount(amount_out - withdrawal_action.amount)
            last_pool_key = path[-1]
            self._update_change(user_address, slippage_out, token_out, last_pool_key)
            amount_out = withdrawal_action.amount
        return SwapResult(Amount(amount_in), Amount(slippage_out), token_in, Amount(amount_out), token_out)
    def _swap_exact_out(self, amount_in: Amount, token_in: TokenUid, amount_out: Amount, pool_key: str, ctx: Context) -> None:
        self._update_twap(pool_key, ctx)
        timestamp = Timestamp(ctx.block.timestamp)
        pool = self.pools[pool_key]
        k_before = Amount(pool.reserve_a * pool.reserve_b)
        reserve_in, reserve_out, _ = self._resolve_token_direction(pool, token_in)
        self._process_swap_fees(pool_key=pool_key, token_in=token_in, amount_in=amount_in, fee_numerator=pool.fee_numerator, fee_denominator=pool.fee_denominator)
        pool = self.pools[pool_key]
        volume_a_increment, volume_b_increment = self._get_volume_increments(token_in, amount_in, amount_out, pool)
        self._update_pool(pool_key, reserve_a=Amount(reserve_in + amount_in) if pool.token_a == token_in else Amount(reserve_out - amount_out), reserve_b=Amount(reserve_out - amount_out) if pool.token_a == token_in else Amount(reserve_in + amount_in), volume_a=Amount(pool.volume_a + volume_a_increment), volume_b=Amount(pool.volume_b + volume_b_increment), last_activity=Timestamp(ctx.block.timestamp), transactions=Amount(pool.transactions + 1))
        pool_after = self.pools[pool_key]
        k_after = Amount(pool_after.reserve_a * pool_after.reserve_b)
        self._check_k_not_decreased(k_before, k_after, '_swap_exact_out')
    def _swap(self, amount_in: Amount, token_in: TokenUid, pool_key: str, ctx: Context) -> Amount:
        self._update_twap(pool_key, ctx)
        pool = self.pools[pool_key]
        k_before = Amount(pool.reserve_a * pool.reserve_b)
        reserve_in, reserve_out, _ = self._resolve_token_direction(pool, token_in)
        fee = pool.fee_numerator
        fee_denominator = pool.fee_denominator
        a = fee_denominator - fee
        b = fee_denominator
        amount_out = reserve_out * amount_in * a // (reserve_in * b + amount_in * a)
        self._process_swap_fees(pool_key=pool_key, token_in=token_in, amount_in=amount_in, fee_numerator=fee, fee_denominator=fee_denominator)
        pool = self.pools[pool_key]
        volume_a_increment, volume_b_increment = self._get_volume_increments(token_in, amount_in, Amount(amount_out), pool)
        self._update_pool(pool_key, reserve_a=Amount(reserve_in + amount_in) if pool.token_a == token_in else Amount(reserve_out - amount_out), reserve_b=Amount(reserve_out - amount_out) if pool.token_a == token_in else Amount(reserve_in + amount_in), volume_a=Amount(pool.volume_a + volume_a_increment), volume_b=Amount(pool.volume_b + volume_b_increment), last_activity=Timestamp(ctx.block.timestamp), transactions=Amount(pool.transactions + 1))
        pool_after = self.pools[pool_key]
        k_after = Amount(pool_after.reserve_a * pool_after.reserve_b)
        self._check_k_not_decreased(k_before, k_after, '_swap')
        return Amount(amount_out)
    @public(allow_withdrawal=True, allow_deposit=True)
    def swap_tokens_for_exact_tokens_through_path(self, ctx: Context, path_str: str, deadline: Timestamp) -> SwapResult:
        self._check_not_paused(ctx)
        assert ctx.block.timestamp <= deadline, f'Transaction expired: block timestamp {ctx.block.timestamp} > deadline {deadline}'
        user_address = ctx.caller_id
        if not path_str:
            raise InvalidPath('Empty path')
        path = path_str.split(',')
        if len(path) == 0 or len(path) > 3:
            raise InvalidPath('Invalid path length')
        self._validate_path_pools_signed(path)
        deposit_action, withdrawal_action = self._get_deposit_and_withdrawal_actions(ctx)
        amount_out = withdrawal_action.amount
        token_out = withdrawal_action.token_uid
        actual_amount_in = deposit_action.amount
        token_in = deposit_action.token_uid
        if len(path) == 1:
            pool_key = path[0]
            if pool_key not in self.pools:
                raise PoolNotFound()
            pool = self.pools[pool_key]
            if token_out != pool.token_a and token_out != pool.token_b:
                raise InvalidPath('Pool does not contain output token')
            if token_in != pool.token_a and token_in != pool.token_b:
                raise InvalidPath('Pool does not contain input token')
            reserve_in, reserve_out, _ = self._resolve_token_direction(pool, token_in)
            if amount_out >= reserve_out:
                raise InsufficientLiquidity('Insufficient funds')
            fee = pool.fee_numerator
            fee_denominator = pool.fee_denominator
            amount_in = self.get_amount_in(amount_out, reserve_in, reserve_out, fee, fee_denominator)
            if actual_amount_in < amount_in:
                raise InvalidAction('Amount in is too low')
            change_in = actual_amount_in - amount_in
            if change_in > 0:
                self._update_change(user_address, change_in, token_in, pool_key)
            self._swap_exact_out(Amount(amount_in), token_in, Amount(amount_out), pool_key, ctx)
            return SwapResult(Amount(actual_amount_in), change_in, token_in, Amount(amount_out), token_out)
        last_pool_key = path[-1]
        if last_pool_key not in self.pools:
            raise PoolNotFound()
        last_pool = self.pools[last_pool_key]
        if token_out != last_pool.token_a and token_out != last_pool.token_b:
            raise InvalidPath('Last pool does not contain output token')
        if len(path) == 2:
            second_pool_key = path[1]
            second_pool = self.pools[second_pool_key]
            intermediate_token = self._get_other_token(second_pool, token_out)
            first_pool_key = path[0]
            if first_pool_key not in self.pools:
                raise PoolNotFound()
            first_pool = self.pools[first_pool_key]
            if token_in != first_pool.token_a and token_in != first_pool.token_b:
                raise InvalidPath('First pool does not contain input token')
            if intermediate_token != first_pool.token_a and intermediate_token != first_pool.token_b:
                raise InvalidPath('First pool does not contain intermediate token')
            _, _, first_hop_token_out = self._resolve_token_direction(first_pool, token_in)
            if first_hop_token_out != intermediate_token:
                raise InvalidPath('Path discontinuity: first hop output does not match intermediate token')
            second_reserve_in, second_reserve_out, _ = self._resolve_token_direction(second_pool, intermediate_token)
            if amount_out >= second_reserve_out:
                raise InsufficientLiquidity('Insufficient funds in second pool')
            second_fee = second_pool.fee_numerator
            second_fee_denominator = second_pool.fee_denominator
            intermediate_amount = self.get_amount_in(amount_out, second_reserve_in, second_reserve_out, second_fee, second_fee_denominator)
            first_reserve_in = 0
            first_reserve_out = 0
            first_reserve_in, first_reserve_out, _ = self._resolve_token_direction(first_pool, token_in)
            if intermediate_amount >= first_reserve_out:
                raise InsufficientLiquidity('Insufficient funds in first pool')
            first_fee = first_pool.fee_numerator
            first_fee_denominator = first_pool.fee_denominator
            amount_in = self.get_amount_in(intermediate_amount, first_reserve_in, first_reserve_out, first_fee, first_fee_denominator)
            if actual_amount_in < amount_in:
                raise InvalidAction('Amount in is too low')
            change_in = actual_amount_in - amount_in
            if change_in > 0:
                self._update_change(user_address, change_in, token_in, first_pool_key)
            self._swap_exact_out(amount_in, token_in, intermediate_amount, first_pool_key, ctx)
            self._swap_exact_out(intermediate_amount, intermediate_token, Amount(amount_out), second_pool_key, ctx)
            return SwapResult(Amount(actual_amount_in), change_in, token_in, Amount(amount_out), token_out)
        if len(path) == 3:
            third_pool_key = path[2]
            if third_pool_key not in self.pools:
                raise PoolNotFound()
            third_pool = self.pools[third_pool_key]
            second_intermediate_token = self._get_other_token(third_pool, token_out)
            second_pool_key = path[1]
            if second_pool_key not in self.pools:
                raise PoolNotFound()
            second_pool = self.pools[second_pool_key]
            first_intermediate_token = self._get_other_token(second_pool, second_intermediate_token)
            first_pool_key = path[0]
            if first_pool_key not in self.pools:
                raise PoolNotFound()
            first_pool = self.pools[first_pool_key]
            if token_in != first_pool.token_a and token_in != first_pool.token_b:
                raise InvalidPath('First pool does not contain input token')
            if first_intermediate_token != first_pool.token_a and first_intermediate_token != first_pool.token_b:
                raise InvalidPath('First pool does not connect to second pool')
            _, _, first_hop_token_out = self._resolve_token_direction(first_pool, token_in)
            if first_hop_token_out != first_intermediate_token:
                raise InvalidPath('Path discontinuity: first hop output does not match intermediate token')
            third_reserve_in, third_reserve_out, _ = self._resolve_token_direction(third_pool, second_intermediate_token)
            if amount_out >= third_reserve_out:
                raise InsufficientLiquidity('Insufficient funds in third pool')
            third_fee = third_pool.fee_numerator
            third_fee_denominator = third_pool.fee_denominator
            second_intermediate_amount = self.get_amount_in(amount_out, third_reserve_in, third_reserve_out, third_fee, third_fee_denominator)
            second_reserve_in, second_reserve_out, _ = self._resolve_token_direction(second_pool, first_intermediate_token)
            if second_intermediate_amount >= second_reserve_out:
                raise InsufficientLiquidity('Insufficient funds in second pool')
            second_fee = second_pool.fee_numerator
            second_fee_denominator = second_pool.fee_denominator
            first_intermediate_amount = self.get_amount_in(second_intermediate_amount, second_reserve_in, second_reserve_out, second_fee, second_fee_denominator)
            first_reserve_in = 0
            first_reserve_out = 0
            first_reserve_in, first_reserve_out, _ = self._resolve_token_direction(first_pool, token_in)
            if first_intermediate_amount >= first_reserve_out:
                raise InsufficientLiquidity('Insufficient funds in first pool')
            first_fee = first_pool.fee_numerator
            first_fee_denominator = first_pool.fee_denominator
            amount_in = self.get_amount_in(first_intermediate_amount, first_reserve_in, first_reserve_out, first_fee, first_fee_denominator)
            if actual_amount_in < amount_in:
                raise InvalidAction('Amount in is too low')
            change_in = actual_amount_in - amount_in
            if change_in > 0:
                self._update_change(user_address, change_in, token_in, first_pool_key)
            self._swap_exact_out(amount_in, token_in, first_intermediate_amount, first_pool_key, ctx)
            self._swap_exact_out(first_intermediate_amount, first_intermediate_token, second_intermediate_amount, second_pool_key, ctx)
            self._swap_exact_out(second_intermediate_amount, second_intermediate_token, Amount(amount_out), third_pool_key, ctx)
            return SwapResult(Amount(actual_amount_in), change_in, token_in, Amount(amount_out), token_out)
        raise InvalidPath('Invalid path length')
    @public(allow_withdrawal=True)
    def withdraw_cashback(self, ctx: Context, pool_key: str) -> None:
        self._check_not_paused(ctx)
        self._validate_pool_exists(pool_key)
        user_address = ctx.caller_id
        pool = self.pools[pool_key]
        current_balance_a, current_balance_b = self.pool_change[pool_key].get(user_address, (Amount(0), Amount(0)))
        self.log.debug('withdrawing cashback', pool_key=pool_key, user=str(user_address), current_balance_a=current_balance_a, current_balance_b=current_balance_b)
        withdraw_a = Amount(0)
        withdraw_b = Amount(0)
        if pool.token_a in ctx.actions:
            action_a = self._get_withdrawal_action(ctx, pool.token_a)
            withdraw_a = Amount(action_a.amount)
            if withdraw_a > current_balance_a:
                raise InvalidAction('Not enough cashback for token A')
        if pool.token_b in ctx.actions:
            action_b = self._get_withdrawal_action(ctx, pool.token_b)
            withdraw_b = Amount(action_b.amount)
            if withdraw_b > current_balance_b:
                raise InvalidAction('Not enough cashback for token B')
        if withdraw_a == 0 and withdraw_b == 0:
            raise InvalidAction('At least one token must be withdrawn')
        for token_uid in ctx.actions.keys():
            assert token_uid == pool.token_a or token_uid == pool.token_b, f'Token {token_uid} is not part of pool {pool_key}'
        new_balance_a = Amount(current_balance_a - withdraw_a)
        new_balance_b = Amount(current_balance_b - withdraw_b)
        self.pool_change[pool_key][user_address] = (new_balance_a, new_balance_b)
        self._update_pool(pool_key, total_change_a=Amount(pool.total_change_a - withdraw_a), total_change_b=Amount(pool.total_change_b - withdraw_b))
        self.log.info('cashback withdrawn', pool_key=pool_key, user=str(user_address), withdraw_a=withdraw_a, withdraw_b=withdraw_b, new_balance_a=new_balance_a, new_balance_b=new_balance_b)
    @public
    def change_protocol_fee(self, ctx: Context, new_fee: int) -> None:
        if ctx.caller_id != self.owner:
            raise Unauthorized('Only the owner can change the protocol fee')
        assert new_fee >= 0, 'Protocol fee must be >= 0'
        assert new_fee <= 50, 'Protocol fee must be <= 50%'
        old_fee = self.default_protocol_fee
        self.default_protocol_fee = Amount(new_fee)
        self.log.info('protocol fee changed', old_fee=old_fee, new_fee=new_fee, caller=str(ctx.caller_id))
    @public
    def update_default_twap_window(self, ctx: Context, new_window: int) -> None:
        if ctx.caller_id != self.owner:
            raise Unauthorized('Only the owner can update the default TWAP window')
        if new_window <= 0:
            raise InvalidState('TWAP window must be greater than 0')
        old_window = self.default_twap_window
        self.default_twap_window = new_window
        self.log.info('default twap window updated', old_window=old_window, new_window=new_window, caller=str(ctx.caller_id))
    @public
    def update_pool_twap_window(self, ctx: Context, pool_key: str, new_window: int) -> None:
        if ctx.caller_id != self.owner:
            raise Unauthorized('Only the owner can update pool TWAP windows')
        if new_window <= 0:
            raise InvalidState('TWAP window must be greater than 0')
        if pool_key not in self.pools:
            raise PoolNotFound(f'Pool {pool_key} not found')
        pool = self.pools[pool_key]
        old_window = pool.twap_window
        if pool.reserve_a > 0 and pool.reserve_b > 0:
            price_a = pool.reserve_b * PRICE_PRECISION // pool.reserve_a
            price_b = pool.reserve_a * PRICE_PRECISION // pool.reserve_b
            new_price_a_window_sum = price_a * new_window
            new_price_b_window_sum = price_b * new_window
            self._update_pool(pool_key, price_a_window_sum=Amount(new_price_a_window_sum), price_b_window_sum=Amount(new_price_b_window_sum), block_timestamp_last=int(ctx.block.timestamp), twap_window=new_window)
        else:
            self._update_pool(pool_key, twap_window=new_window)
        self.log.info('pool twap window updated', pool_key=pool_key, old_window=old_window, new_window=new_window, caller=str(ctx.caller_id))
    @public
    def add_authorized_signer(self, ctx: Context, signer_address: CallerId) -> None:
        if ctx.caller_id != self.owner:
            raise Unauthorized('Only the owner can add authorized signers')
        self.authorized_signers.add(signer_address)
        self.log.info('authorized signer added', signer_address=str(signer_address), caller=str(ctx.caller_id))
    @public
    def remove_authorized_signer(self, ctx: Context, signer_address: CallerId) -> None:
        if ctx.caller_id != self.owner:
            raise Unauthorized('Only the owner can remove authorized signers')
        if signer_address == self.owner:
            raise NCFail('Cannot remove the owner as an authorized signer')
        self.authorized_signers.discard(signer_address)
        self.log.info('authorized signer removed', signer_address=str(signer_address), caller=str(ctx.caller_id))
    @public
    def initialize_reserved_pools(self, ctx: Context) -> None:
        if ctx.caller_id != self.owner:
            raise Unauthorized('Only the owner can run this migration')
        self.reserved_pools = {}
        self.log.info('reserved_pools initialized', caller=str(ctx.caller_id))
    @public
    def reserve_pool_creation(self, ctx: Context, token_uid: TokenUid) -> None:
        if ctx.caller_id not in self.authorized_signers:
            raise Unauthorized('Only authorized signers can reserve pools')
        if token_uid == HATHOR_TOKEN_UID:
            raise InvalidTokens('Cannot reserve the native HTR token')
        existing = self.reserved_pools.get(token_uid)
        if existing is not None and existing != ctx.caller_id:
            raise Unauthorized('Token already reserved by another signer')
        self.reserved_pools[token_uid] = ctx.caller_id
        self.log.info('pool creation reserved', token_uid=token_uid.hex(), reserver=str(ctx.caller_id))
    @public
    def release_pool_reservation(self, ctx: Context, token_uid: TokenUid) -> None:
        reserver = self.reserved_pools.get(token_uid)
        if reserver is None:
            return
        if ctx.caller_id != reserver and ctx.caller_id != self.owner:
            raise Unauthorized('Only the reserver or owner can release')
        del self.reserved_pools[token_uid]
        self.log.info('pool creation reservation released', token_uid=token_uid.hex(), caller=str(ctx.caller_id))
    @public
    def sign_pool(self, ctx: Context, token_a: TokenUid, token_b: TokenUid, fee: Amount) -> None:
        if ctx.caller_id not in self.authorized_signers:
            raise Unauthorized('Only authorized signers can sign pools')
        token_a, token_b = self._order_tokens(token_a, token_b)
        pool_key = self._get_pool_key(token_a, token_b, fee)
        self._validate_pool_exists(pool_key)
        self.pool_signers[pool_key] = ctx.caller_id
        self.log.info('pool signed', pool_key=pool_key, token_a=token_a.hex(), token_b=token_b.hex(), fee=fee, signer=str(ctx.caller_id))
    @public
    def unsign_pool(self, ctx: Context, token_a: TokenUid, token_b: TokenUid, fee: Amount) -> None:
        token_a, token_b = self._order_tokens(token_a, token_b)
        pool_key = self._get_pool_key(token_a, token_b, fee)
        self._validate_pool_exists(pool_key)
        if not pool_key in self.pool_signers:
            return
        original_signer = self.pool_signers.get(pool_key)
        if ctx.caller_id != self.owner and ctx.caller_id != original_signer:
            raise Unauthorized('Only the owner or original signer can unsign a pool')
        if pool_key in self.pool_signers:
            del self.pool_signers[pool_key]
        self.log.info('pool unsigned', pool_key=pool_key, token_a=token_a.hex(), token_b=token_b.hex(), fee=fee, caller=str(ctx.caller_id))
    @public
    def set_htr_usd_pool(self, ctx: Context, token_a: TokenUid, token_b: TokenUid, fee: Amount) -> None:
        if ctx.caller_id != self.owner:
            raise Unauthorized('Only the owner can set the HTR-USD pool')
        token_a, token_b = self._order_tokens(token_a, token_b)
        pool_key = self._get_pool_key(token_a, token_b, fee)
        self._validate_pool_exists(pool_key)
        if token_a != HATHOR_TOKEN_UID and token_b != HATHOR_TOKEN_UID:
            raise InvalidTokens('HTR-USD pool must contain HTR as one of the tokens')
        self.htr_usd_pool_key = pool_key
        self.log.info('htr usd pool set', pool_key=pool_key, token_a=token_a.hex(), token_b=token_b.hex(), fee=fee, caller=str(ctx.caller_id))
    @public
    def pause(self, ctx: Context) -> None:
        if ctx.caller_id != self.owner:
            raise Unauthorized('Only owner can pause')
        self.paused = True
        self.log.info('contract paused', caller=str(ctx.caller_id))
    @public
    def unpause(self, ctx: Context) -> None:
        if ctx.caller_id != self.owner:
            raise Unauthorized('Only owner can unpause')
        self.paused = False
        self.log.info('contract unpaused', caller=str(ctx.caller_id))
    @public(allow_deposit=True)
    def replenish_funds(self, ctx: Context) -> None:
        if ctx.caller_id != self.owner:
            raise Unauthorized('Only the owner can replenish funds')
        if len(ctx.actions) != 1:
            raise InvalidAction('Must provide exactly one token deposit')
        token = list(ctx.actions.keys())[0]
        deposit_action = self._get_deposit_action(ctx, token)
        self.log.info('funds replenished', caller=str(ctx.caller_id), token=deposit_action.token_uid.hex(), amount=deposit_action.amount)
    @view
    def is_paused(self) -> bool:
        return self.paused
    @view
    def get_signed_pools(self) -> list[str]:
        result = []
        for pool_key in self.all_pools:
            if pool_key not in self.pool_signers:
                continue
            result.append(pool_key)
        return result
    @view
    def is_authorized_signer(self, address: CallerId) -> bool:
        return address in self.authorized_signers
    @view
    def get_htr_usd_pool(self) -> str | None:
        return self.htr_usd_pool_key
    @view
    def get_user_pools(self, address: CallerId) -> list[str]:
        user_pools = []
        for pool_key in self.all_pools:
            user_liquidity = self.pool_user_liquidity[pool_key].get(address, 0)
            if user_liquidity > 0:
                user_pools.append(pool_key)
        return user_pools
    @view
    def get_user_positions(self, address: CallerId) -> dict[str, UserPosition]:
        positions = {}
        for pool_key in self.all_pools:
            user_liquidity = self.pool_user_liquidity[pool_key].get(address, 0)
            if user_liquidity > 0:
                user_info = self.user_info(address, pool_key)
                positions[pool_key] = UserPosition(liquidity=user_info.liquidity, token0Amount=user_info.token0Amount, token1Amount=user_info.token1Amount, share=user_info.share, balance_a=user_info.balance_a, balance_b=user_info.balance_b, token_a=user_info.token_a, token_b=user_info.token_b)
        return positions
    @view
    def get_token_price_in_htr(self, token: TokenUid) -> Amount:
        if token == HATHOR_TOKEN_UID:
            return Amount(100000000)
        token_usd_price = self.get_token_price_in_usd(token)
        if token_usd_price == 0:
            return Amount(0)
        htr_usd_price = self.get_token_price_in_usd(HATHOR_TOKEN_UID)
        if htr_usd_price == 0:
            return Amount(0)
        return Amount(token_usd_price * 100000000 // htr_usd_price)
    @view
    def get_all_token_prices_in_htr(self) -> dict[str, Amount]:
        result = {}
        result[HATHOR_TOKEN_UID.hex()] = Amount(100000000)
        unique_tokens = set()
        for pool_key in self.all_pools:
            pool = self.pools[pool_key]
            token_a = pool.token_a
            token_b = pool.token_b
            unique_tokens.add(token_a)
            unique_tokens.add(token_b)
        for token in unique_tokens:
            if token != HATHOR_TOKEN_UID:
                price = self.get_token_price_in_htr(token)
                if price > 0:
                    result[token.hex()] = Amount(price)
        return result
    @view
    def get_token_price_in_usd(self, token: TokenUid) -> Amount:
        if not self.htr_usd_pool_key:
            return Amount(0)
        pool_key = self.htr_usd_pool_key
        pool = self.pools[pool_key]
        if pool.token_a == HATHOR_TOKEN_UID:
            usd_token = pool.token_b
        else:
            usd_token = pool.token_a
        if token == usd_token:
            return Amount(100000000)
        ref_amount = Amount(10000)
        swap_info = self.find_best_swap_path(ref_amount, usd_token, token, 3)
        if not swap_info.path or swap_info.amount_out == 0:
            return Amount(0)
        pool_keys = swap_info.path.split(',')
        final_price = 100000000
        current_token = token
        for i, pool_key_iter in enumerate(reversed(pool_keys)):
            pool_iter = self.pools[pool_key_iter]
            swap_info = self._try_resolve_token_direction(pool_iter, current_token)
            if swap_info is None:
                return Amount(0)
            reserve_in, reserve_out, next_token = swap_info
            if reserve_in == 0:
                return Amount(0)
            final_price = final_price * reserve_out // reserve_in
            current_token = next_token
        result = Amount(final_price)
        return result
    @view
    def get_pool_twap_timestamp(self, token_a: TokenUid, token_b: TokenUid, fee: Amount) -> int:
        token_a_ordered, token_b_ordered = self._order_tokens(token_a, token_b)
        pool_key = self._get_pool_key(token_a_ordered, token_b_ordered, fee)
        pool = self.pools.get(pool_key)
        if not pool:
            raise PoolNotFound(f'Pool {pool_key} not found')
        return pool.block_timestamp_last
    @view
    def get_twap_price(self, token_a: TokenUid, token_b: TokenUid, fee: Amount, current_timestamp: int) -> Amount:
        token_a_ordered, token_b_ordered = self._order_tokens(token_a, token_b)
        pool_key = self._get_pool_key(token_a_ordered, token_b_ordered, fee)
        pool = self.pools.get(pool_key)
        if not pool:
            raise PoolNotFound(f'Pool {pool_key} not found')
        if pool.reserve_a == 0 or pool.reserve_b == 0:
            raise NCFail('Pool has no liquidity')
        time_elapsed = current_timestamp - pool.block_timestamp_last
        price_a_now = Amount(pool.reserve_b * PRICE_PRECISION // pool.reserve_a)
        price_b_now = Amount(pool.reserve_a * PRICE_PRECISION // pool.reserve_b)
        current_window_sum_a, current_window_sum_b = self._calculate_window_sums(pool, time_elapsed, price_a_now, price_b_now)
        if token_a == pool.token_a:
            twap_price = Amount(current_window_sum_b // pool.twap_window)
        else:
            twap_price = Amount(current_window_sum_a // pool.twap_window)
        return twap_price
    @view
    def get_all_token_prices_in_usd(self) -> dict[str, Amount]:
        if not self.htr_usd_pool_key:
            return {}
        result = {}
        pool_key = self.htr_usd_pool_key
        pool = self.pools[pool_key]
        if pool.token_a == HATHOR_TOKEN_UID:
            usd_token = pool.token_b
        else:
            usd_token = pool.token_a
        unique_tokens = set()
        for pool_key_iter in self.all_pools:
            pool_iter = self.pools[pool_key_iter]
            token_a = pool_iter.token_a
            token_b = pool_iter.token_b
            unique_tokens.add(token_a)
            unique_tokens.add(token_b)
        for token in unique_tokens:
            if token == usd_token:
                result[token.hex()] = Amount(100000000)
            else:
                price = self.get_token_price_in_usd(token)
                if price > 0:
                    result[token.hex()] = Amount(price)
        return result
    @public
    def change_owner(self, ctx: Context, new_owner: Address) -> None:
        if ctx.caller_id != self.owner:
            raise Unauthorized('Only owner can change owner')
        old_owner = self.owner
        self.owner = new_owner
        self.authorized_signers.discard(old_owner)
        self.authorized_signers.add(new_owner)
        self.log.info('owner changed', old_owner=str(old_owner), new_owner=str(new_owner), caller=str(ctx.caller_id))
    @public
    def upgrade_contract(self, ctx: Context, new_blueprint_id: BlueprintId, new_version: str) -> None:
        if ctx.caller_id != self.owner:
            raise Unauthorized('Only owner can upgrade contract')
        if not self._is_version_higher(new_version, self.contract_version):
            raise InvalidVersion(f'New version {new_version} must be higher than current {self.contract_version}')
        old_version = self.contract_version
        self.contract_version = new_version
        self.log.info('upgrading contract', old_version=old_version, new_version=new_version, new_blueprint_id=str(new_blueprint_id), caller=str(ctx.caller_id))
        self.syscall.change_blueprint(new_blueprint_id)
    def _is_version_higher(self, new_version: str, current_version: str) -> bool:
        new_parts_str = new_version.split('.')
        current_parts_str = current_version.split('.')
        new_parts: list[int] = []
        for part in new_parts_str:
            if not part or not all((c in '0123456789' for c in part)):
                return False
            new_parts.append(int(part))
        current_parts: list[int] = []
        for part in current_parts_str:
            if not part or not all((c in '0123456789' for c in part)):
                return False
            current_parts.append(int(part))
        max_len = len(new_parts) if len(new_parts) > len(current_parts) else len(current_parts)
        while len(new_parts) < max_len:
            new_parts.append(0)
        while len(current_parts) < max_len:
            current_parts.append(0)
        return new_parts > current_parts
    @view
    def get_contract_version(self) -> str:
        return self.contract_version
    @view
    def get_reserves(self, token_a: TokenUid, token_b: TokenUid, fee: Amount) -> tuple[Amount, Amount]:
        token_a, token_b = self._order_tokens(token_a, token_b)
        pool_key = self._get_pool_key(token_a, token_b, fee)
        self._validate_pool_exists(pool_key)
        pool = self.pools[pool_key]
        return (pool.reserve_a, pool.reserve_b)
    @view
    def get_all_pools(self) -> list[str]:
        result = []
        for pool_key in self.all_pools:
            result.append(pool_key)
        return result
    def _page_bounds(self, skip: int, limit: int) -> tuple[int, int]:
        if skip < 0 or limit <= 0:
            raise InvalidAction('Invalid page parameters')
        if limit > MAX_PAGE_SIZE:
            limit = MAX_PAGE_SIZE
        total = len(self.all_pools)
        end = skip + limit
        if end > total:
            end = total
        if skip > end:
            skip = end
        return (skip, end)
    def _page_unique_tokens(self, start: int, end: int) -> set[TokenUid]:
        unique_tokens = set()
        for i in range(start, end):
            pool = self.pools[self.all_pools[i]]
            unique_tokens.add(pool.token_a)
            unique_tokens.add(pool.token_b)
        return unique_tokens
    @view
    def get_pool_count(self) -> int:
        return len(self.all_pools)
    @view
    def get_pools_page(self, skip: int, limit: int) -> list[str]:
        start, end = self._page_bounds(skip, limit)
        result = []
        for i in range(start, end):
            result.append(self.all_pools[i])
        return result
    @view
    def get_signed_pools_page(self, skip: int, limit: int) -> list[str]:
        start, end = self._page_bounds(skip, limit)
        result = []
        for i in range(start, end):
            pool_key = self.all_pools[i]
            if pool_key in self.pool_signers:
                result.append(pool_key)
        return result
    @view
    def get_user_pools_page(self, address: CallerId, skip: int, limit: int) -> list[str]:
        start, end = self._page_bounds(skip, limit)
        user_pools = []
        for i in range(start, end):
            pool_key = self.all_pools[i]
            if self.pool_user_liquidity[pool_key].get(address, 0) > 0:
                user_pools.append(pool_key)
        return user_pools
    @view
    def get_user_positions_page(self, address: CallerId, skip: int, limit: int) -> dict[str, UserPosition]:
        start, end = self._page_bounds(skip, limit)
        positions = {}
        for i in range(start, end):
            pool_key = self.all_pools[i]
            if self.pool_user_liquidity[pool_key].get(address, 0) > 0:
                user_info = self.user_info(address, pool_key)
                positions[pool_key] = UserPosition(liquidity=user_info.liquidity, token0Amount=user_info.token0Amount, token1Amount=user_info.token1Amount, share=user_info.share, balance_a=user_info.balance_a, balance_b=user_info.balance_b, token_a=user_info.token_a, token_b=user_info.token_b)
        return positions
    @view
    def get_token_prices_in_htr_page(self, skip: int, limit: int) -> dict[str, Amount]:
        start, end = self._page_bounds(skip, limit)
        result = {}
        result[HATHOR_TOKEN_UID.hex()] = Amount(100000000)
        for token in self._page_unique_tokens(start, end):
            if token != HATHOR_TOKEN_UID:
                price = self.get_token_price_in_htr(token)
                if price > 0:
                    result[token.hex()] = Amount(price)
        return result
    @view
    def get_token_prices_in_usd_page(self, skip: int, limit: int) -> dict[str, Amount]:
        start, end = self._page_bounds(skip, limit)
        if not self.htr_usd_pool_key:
            return {}
        result = {}
        usd_pool = self.pools[self.htr_usd_pool_key]
        if usd_pool.token_a == HATHOR_TOKEN_UID:
            usd_token = usd_pool.token_b
        else:
            usd_token = usd_pool.token_a
        for token in self._page_unique_tokens(start, end):
            if token == usd_token:
                result[token.hex()] = Amount(100000000)
            else:
                price = self.get_token_price_in_usd(token)
                if price > 0:
                    result[token.hex()] = Amount(price)
        return result
    @view
    def get_pools_for_token(self, token: TokenUid) -> list[str]:
        if token not in self.token_to_pools:
            return []
        result = []
        for pool_key in self.token_to_pools[token]:
            result.append(pool_key)
        return result
    @view
    def liquidity_of(self, address: CallerId, pool_key: str) -> Amount:
        self._validate_pool_exists(pool_key)
        return Amount(self.pool_user_liquidity[pool_key].get(address, 0))
    @view
    def change_of(self, address: CallerId, pool_key: str) -> tuple[Amount, Amount]:
        self._validate_pool_exists(pool_key)
        change_a, change_b = self.pool_change[pool_key].get(address, (Amount(0), Amount(0)))
        return (change_a, change_b)
    @view
    def front_end_api_pool(self, pool_key: str) -> PoolApiInfo:
        token_a, token_b, fee = pool_key.split('/')
        token_a = TokenUid(bytes.fromhex(token_a))
        token_b = TokenUid(bytes.fromhex(token_b))
        fee = Amount(int(fee))
        token_a, token_b = self._order_tokens(token_a, token_b)
        self._validate_pool_exists(pool_key)
        pool = self.pools[pool_key]
        is_signed = pool_key in self.pool_signers
        signer_address = self.pool_signers.get(pool_key, None)
        signer_str = signer_address.hex() if signer_address is not None else None
        return PoolApiInfo(reserve0=Amount(pool.reserve_a), reserve1=Amount(pool.reserve_b), fee=Amount(pool.fee_numerator), volume=Amount(pool.volume_a), fee0=Amount(self.pool_accumulated_fee[pool_key].get(token_a, 0)), fee1=Amount(self.pool_accumulated_fee[pool_key].get(token_b, 0)), dzr_rewards=Amount(1000), transactions=Amount(pool.transactions), is_signed=Amount(1 if is_signed else 0), signer=signer_str)
    @view
    def pool_info(self, pool_key: str) -> PoolInfo:
        self._validate_pool_exists(pool_key)
        pool = self.pools[pool_key]
        is_signed = pool_key in self.pool_signers
        signer_address = self.pool_signers.get(pool_key, None)
        signer_str = signer_address.hex() if signer_address is not None else None
        return PoolInfo(token_a=pool.token_a.hex(), token_b=pool.token_b.hex(), reserve_a=pool.reserve_a, reserve_b=pool.reserve_b, fee=pool.fee_numerator, total_liquidity=pool.total_liquidity, transactions=pool.transactions, volume_a=pool.volume_a, volume_b=pool.volume_b, last_activity=pool.last_activity, is_signed=is_signed, signer=signer_str)
    @view
    def user_info(self, address: CallerId, pool_key: str) -> UserInfo:
        self._validate_pool_exists(pool_key)
        pool = self.pools[pool_key]
        liquidity = self.pool_user_liquidity[pool_key].get(address, 0)
        balance_a, balance_b = self.pool_change[pool_key].get(address, (Amount(0), Amount(0)))
        share = 0
        total_liquidity = pool.total_liquidity
        if total_liquidity > 0:
            share = liquidity * 100 // total_liquidity
        reserve_a = pool.reserve_a
        reserve_b = pool.reserve_b
        token_a_amount = 0
        token_b_amount = 0
        if total_liquidity > 0:
            token_a_amount = reserve_a * liquidity // total_liquidity
            token_b_amount = reserve_b * liquidity // total_liquidity
        return UserInfo(liquidity=Amount(liquidity), token0Amount=Amount(token_a_amount), token1Amount=Amount(token_b_amount), share=Amount(share), balance_a=Amount(balance_a), balance_b=Amount(balance_b), token_a=pool.token_a.hex(), token_b=pool.token_b.hex())
    @view
    def get_user_profit_info(self, address: CallerId, pool_key: str) -> UserProfitInfo:
        self._validate_pool_exists(pool_key)
        user_liquidity = self.pool_user_liquidity[pool_key].get(address, 0)
        if user_liquidity == 0:
            return UserProfitInfo(current_value_usd=Amount(0), initial_value_usd=Amount(0), profit_amount_usd=Amount(0), profit_percentage=Amount(0), last_action_timestamp=0)
        current_value_usd = self._calculate_user_position_usd_value(address, pool_key)
        initial_value_usd = self.pool_user_deposit_price_usd[pool_key].get(address, 0)
        last_action_timestamp = self.pool_user_last_action_timestamp[pool_key].get(address, 0)
        if initial_value_usd == 0:
            profit_amount_usd = Amount(0)
            profit_percentage = Amount(0)
        else:
            profit_amount_usd = current_value_usd - initial_value_usd
            profit_percentage = profit_amount_usd * 10000 // initial_value_usd
        return UserProfitInfo(current_value_usd=current_value_usd, initial_value_usd=Amount(initial_value_usd), profit_amount_usd=profit_amount_usd, profit_percentage=profit_percentage, last_action_timestamp=last_action_timestamp)
    @view
    def find_best_swap_path(self, amount_in: Amount, token_in: TokenUid, token_out: TokenUid, max_hops: int) -> SwapPathInfo:
        if max_hops > 3:
            max_hops = 3
        graph = self._build_token_graph(amount_in)
        if token_in not in graph:
            return SwapPathInfo(path='', amounts=[amount_in], amount_out=Amount(0), price_impact=Amount(0))
        path_info = self._dijkstra_shortest_path(graph, token_in, token_out, amount_in, max_hops)
        if not path_info['path']:
            return SwapPathInfo(path='', amounts=[amount_in], amount_out=Amount(0), price_impact=Amount(0))
        price_impact = self._calculate_price_impact(amount_in, path_info['amount_out'], path_info['path'], token_in, token_out)
        return SwapPathInfo(path=path_info['path'], amounts=path_info['amounts'], amount_out=path_info['amount_out'], price_impact=price_impact)
    @view
    def _build_token_graph(self, reference_amount: Amount) -> dict[TokenUid, dict[TokenUid, tuple[Amount, str, Amount]]]:
        graph = {}
        count = 0
        for pool_key in self.all_pools:
            if pool_key not in self.pool_signers:
                continue
            if count >= MAX_POOLS_TO_ITERATE:
                break
            count += 1
            pool = self.pools[pool_key]
            token_a = pool.token_a
            token_b = pool.token_b
            fee = pool.fee_numerator
            fee_denominator = pool.fee_denominator
            reserve_a = pool.reserve_a
            reserve_b = pool.reserve_b
            if reserve_a > 0 and reserve_b > 0 and (fee_denominator > 0):
                a = fee_denominator - fee
                b = fee_denominator
                denominator = reserve_a * b + reference_amount * a
                if denominator > 0:
                    output_b = reserve_b * reference_amount * a // denominator
                    if output_b <= reserve_b:
                        if token_a not in graph:
                            graph[token_a] = {}
                        if token_b not in graph[token_a] or output_b > graph[token_a][token_b][0]:
                            graph[token_a][token_b] = (output_b, pool_key, fee)
            if reserve_a > 0 and reserve_b > 0 and (fee_denominator > 0):
                a = fee_denominator - fee
                b = fee_denominator
                denominator = reserve_b * b + reference_amount * a
                if denominator > 0:
                    output_a = reserve_a * reference_amount * a // denominator
                    if output_a <= reserve_a:
                        if token_b not in graph:
                            graph[token_b] = {}
                        if token_a not in graph[token_b] or output_a > graph[token_b][token_a][0]:
                            graph[token_b][token_a] = (output_a, pool_key, fee)
        return graph
    @view
    def _dijkstra_shortest_path(self, graph: dict[TokenUid, dict[TokenUid, tuple[Amount, str, Amount]]], start: TokenUid, end: TokenUid, amount_in: Amount, max_hops: int) -> dict[str, str | list[Amount] | int]:
        distances = {}
        previous = {}
        unvisited = set()
        for token in graph.keys():
            distances[token] = (0, 0)
            unvisited.add(token)
        distances[start] = (amount_in, 0)
        while unvisited:
            current = None
            max_amount = 0
            for token in unvisited:
                amount, hops = distances[token]
                if amount > max_amount or (
                    amount == max_amount and current is not None and token < current
                ):
                    max_amount = amount
                    current = token
            if current is None or max_amount == 0:
                break
            if current == end:
                break
            current_amount, current_hops = distances[current]
            if current_hops >= max_hops:
                unvisited.remove(current)
                continue
            unvisited.remove(current)
            if current not in graph:
                continue
            for neighbor, (reference_output, pool_key, fee) in graph[current].items():
                pool = self.pools[pool_key]
                if neighbor not in unvisited:
                    continue
                swap_info = self._try_resolve_token_direction(pool, current)
                if swap_info is None:
                    continue
                reserve_in, reserve_out, _ = swap_info
                if reserve_in > 0 and reserve_out > 0:
                    fee_denominator = pool.fee_denominator
                    if fee_denominator > 0:
                        a = fee_denominator - fee
                        b = fee_denominator
                        denominator = reserve_in * b + current_amount * a
                        if denominator > 0:
                            actual_output = reserve_out * current_amount * a // denominator
                            if actual_output <= reserve_out:
                                neighbor_amount, neighbor_hops = distances[neighbor]
                                new_hops = current_hops + 1
                                if actual_output > neighbor_amount:
                                    distances[neighbor] = (actual_output, new_hops)
                                    previous[neighbor] = (current, pool_key)
        if end not in previous and end != start:
            return {'path': '', 'amounts': [amount_in], 'amount_out': 0}
        path_pools = []
        amounts = []
        current = end
        while current in previous:
            prev_token, pool_key = previous[current]
            path_pools.insert(0, pool_key)
            amounts.insert(0, distances[current][0])
            current = prev_token
        amounts.insert(0, amount_in)
        final_amount = distances[end][0] if end in distances else 0
        return {'path': ','.join(path_pools), 'amounts': amounts, 'amount_out': final_amount}
    @view
    def _calculate_price_impact(self, amount_in: Amount, amount_out: Amount, path: str, token_in: TokenUid, token_out: TokenUid) -> Amount:
        if not path or amount_out == 0:
            return Amount(0)
        pool_keys = path.split(',')
        if len(pool_keys) == 1:
            pool_key = pool_keys[0]
            pool = self.pools[pool_key]
            reserve_in, reserve_out, _ = self._resolve_token_direction(pool, token_in)
            if reserve_in > 0:
                no_fee_quote = amount_in * reserve_out // reserve_in
                if no_fee_quote > 0:
                    price_impact = 10000 * (no_fee_quote - amount_out) // no_fee_quote
                    return Amount(max(0, price_impact))
        return self._calculate_multi_hop_price_impact(amount_in, amount_out, pool_keys, token_in)
    @view
    def _calculate_multi_hop_price_impact(self, amount_in: Amount, amount_out: Amount, pool_keys: list[str], token_in: TokenUid) -> Amount:
        if len(pool_keys) <= 1 or amount_out == 0:
            return Amount(0)
        theoretical_amount_out = self._calculate_theoretical_multi_hop_output(amount_in, pool_keys, token_in)
        if theoretical_amount_out == 0:
            return Amount(0)
        price_impact = 10000 * (theoretical_amount_out - amount_out) // theoretical_amount_out
        return Amount(max(0, min(price_impact, 10000)))
    @view
    def _calculate_theoretical_multi_hop_output(self, amount_in: Amount, pool_keys: list[str], token_in: TokenUid) -> Amount:
        ref_amount = max(Amount(1), amount_in // 100)
        current_amount = ref_amount
        current_token = token_in
        for pool_key in pool_keys:
            if pool_key not in self.pools:
                return Amount(0)
            pool = self.pools[pool_key]
            swap_info = self._try_resolve_token_direction(pool, current_token)
            if swap_info is None:
                return Amount(0)
            reserve_in, reserve_out, current_token = swap_info
            if reserve_in == 0:
                return Amount(0)
            current_amount = current_amount * reserve_out // reserve_in
            if current_amount == 0:
                return Amount(0)
        if ref_amount == 0:
            return Amount(0)
        theoretical_output = current_amount * amount_in // ref_amount
        return Amount(theoretical_output)
    @view
    def find_best_swap_path_exact_output(self, amount_out: Amount, token_in: TokenUid, token_out: TokenUid, max_hops: int) -> SwapPathExactOutputInfo:
        if max_hops > 3:
            max_hops = 3
        graph = self._build_reverse_token_graph(amount_out)
        if token_out not in graph:
            return SwapPathExactOutputInfo(path='', amounts=[amount_out], amount_in=Amount(0), price_impact=Amount(0))
        path_info = self._dijkstra_reverse_shortest_path(graph, token_out, token_in, amount_out, max_hops)
        if not path_info['path']:
            return SwapPathExactOutputInfo(path='', amounts=[amount_out], amount_in=Amount(0), price_impact=Amount(0))
        price_impact = self._calculate_price_impact(path_info['amount_in'], amount_out, path_info['path'], token_in, token_out)
        return SwapPathExactOutputInfo(path=path_info['path'], amounts=path_info['amounts'], amount_in=path_info['amount_in'], price_impact=price_impact)
    @view
    def _build_reverse_token_graph(self, reference_amount: Amount) -> dict[TokenUid, dict[TokenUid, tuple[Amount, str, Amount]]]:
        graph = {}
        count = 0
        for pool_key in self.all_pools:
            if pool_key not in self.pool_signers:
                continue
            if count >= MAX_POOLS_TO_ITERATE:
                break
            count += 1
            pool = self.pools[pool_key]
            token_a = pool.token_a
            token_b = pool.token_b
            fee = pool.fee_numerator
            fee_denominator = pool.fee_denominator
            reserve_a = pool.reserve_a
            reserve_b = pool.reserve_b
            if reserve_a > 0 and reserve_b > 0 and (fee_denominator > 0) and (reference_amount < reserve_b):
                a = fee_denominator - fee
                b = fee_denominator
                denominator = (reserve_b - reference_amount) * a
                if denominator > 0:
                    input_a = reserve_a * reference_amount * b // denominator
                    if token_b not in graph:
                        graph[token_b] = {}
                    if token_a not in graph[token_b] or graph[token_b][token_a][0] > input_a:
                        graph[token_b][token_a] = (input_a, pool_key, fee)
            if reserve_a > 0 and reserve_b > 0 and (fee_denominator > 0) and (reference_amount < reserve_a):
                a = fee_denominator - fee
                b = fee_denominator
                denominator = (reserve_a - reference_amount) * a
                if denominator > 0:
                    input_b = reserve_b * reference_amount * b // denominator
                    if token_a not in graph:
                        graph[token_a] = {}
                    if token_b not in graph[token_a] or graph[token_a][token_b][0] > input_b:
                        graph[token_a][token_b] = (input_b, pool_key, fee)
        return graph
    @view
    def _dijkstra_reverse_shortest_path(self, graph: dict[TokenUid, dict[TokenUid, tuple[Amount, str, Amount]]], start_token: TokenUid, end_token: TokenUid, amount_out: Amount, max_hops: int) -> dict[str, str | list[Amount] | int]:
        distances = {}
        previous = {}
        unvisited = set()
        for token in graph.keys():
            distances[token] = (Amount(2 ** 256 - 1), 0)
            unvisited.add(token)
        distances[start_token] = (amount_out, 0)
        while unvisited:
            current = None
            min_amount = Amount(2 ** 256 - 1)
            for token in unvisited:
                amount, _ = distances[token]
                if amount < min_amount or (
                    amount == min_amount and current is not None and token < current
                ):
                    min_amount = amount
                    current = token
            if current is None or min_amount == Amount(2 ** 256 - 1):
                break
            if current == end_token:
                break
            current_amount, current_hops = distances[current]
            if current_hops >= max_hops:
                unvisited.remove(current)
                continue
            unvisited.remove(current)
            if current not in graph:
                continue
            for neighbor, (reference_input, pool_key, fee) in graph[current].items():
                if neighbor not in unvisited:
                    continue
                pool = self.pools[pool_key]
                info = self._try_resolve_token_direction(pool, neighbor)
                if info is None:
                    continue
                reserve_in, reserve_out, _ = info
                if reserve_in > 0 and reserve_out > 0:
                    fee_denominator = pool.fee_denominator
                    if fee_denominator > 0 and current_amount < reserve_out:
                        a = fee_denominator - fee
                        b = fee_denominator
                        denominator = (reserve_out - current_amount) * a
                        if denominator > 0:
                            required_input_for_neighbor = self.get_amount_in(Amount(current_amount), reserve_in, reserve_out, fee, fee_denominator)
                            neighbor_amount, _ = distances[neighbor]
                            new_hops = current_hops + 1
                            if required_input_for_neighbor < neighbor_amount:
                                distances[neighbor] = (required_input_for_neighbor, new_hops)
                                previous[neighbor] = (current, pool_key)
        final_input_amount = distances.get(end_token, (Amount(2 ** 256 - 1), 0))[0]
        if final_input_amount == Amount(2 ** 256 - 1):
            return {'path': '', 'amounts': [amount_out], 'amount_in': 0}
        path_pools = []
        amounts = []
        current = end_token
        while current in previous:
            prev_token, pool_key = previous[current]
            path_pools.insert(0, pool_key)
            amounts.insert(0, distances[current][0])
            current = prev_token
        amounts.insert(0, distances[start_token][0])
        return {'path': ','.join(path_pools), 'amounts': amounts, 'amount_in': final_input_amount}
