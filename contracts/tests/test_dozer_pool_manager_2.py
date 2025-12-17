import pytest

from hathor import Address, Amount, NCDepositAction, NCFail, NCWithdrawalAction, TokenUid
from hathor_tests.nanocontracts.blueprints.unittest import BlueprintTestCase
from hathor.nanocontracts.blueprints.dozer_pool_manager import (
    DozerPoolManager,
    InvalidAction,
    InvalidFee,
    InvalidState,
    PoolExists,
    PoolState,
    SwapResult,
    Unauthorized,
)


class TestDozerPoolManager(BlueprintTestCase):
    def setUp(self) -> None:
        super().setUp()

        self.blueprint_id = self._register_blueprint_class(DozerPoolManager)
        self.contract_id = self.gen_random_contract_id()

        self.token_a = self.gen_random_token_uid()
        self.token_b = self.gen_random_token_uid()
        self.token_c = self.gen_random_token_uid()
        self.token_d = self.gen_random_token_uid()
        self.token_e = self.gen_random_token_uid()

        ctx = self.create_context()
        self.runner.create_contract(self.contract_id, self.blueprint_id, ctx)
        assert isinstance(ctx.caller_id, Address)
        self.owner = ctx.caller_id

    def get_contract(self) -> DozerPoolManager:
        contract = self.get_readonly_contract(self.contract_id)
        assert isinstance(contract, DozerPoolManager)
        return contract

    def get_pool_state(self, pool_key: str) -> PoolState:
        contract = self.get_contract()
        return contract.pools[pool_key]

    def create_pool(
        self,
        *,
        token_a: TokenUid,
        token_b: TokenUid,
        fee: int,
        reserve_a: int,
        reserve_b: int,
    ) -> tuple[str, Address]:
        ctx = self.create_context(actions=[
            NCDepositAction(token_uid=token_a, amount=reserve_a),
            NCDepositAction(token_uid=token_b, amount=reserve_b),
        ],
        timestamp=1)
        pool_key = self.runner.call_public_method(self.contract_id, 'create_pool', ctx, fee)
        assert isinstance(ctx.caller_id, Address)
        return pool_key, ctx.caller_id

    def add_liquidity(
        self,
        *,
        token_a: TokenUid,
        token_b: TokenUid,
        fee: int,
        amount_a: int,
        amount_b: int,
    ) -> tuple[TokenUid, Amount, Address]:
        ctx = self.create_context(actions=[
            NCDepositAction(token_uid=token_a, amount=amount_a),
            NCDepositAction(token_uid=token_b, amount=amount_b),
        ],
        timestamp=10)
        token_uid, amount = self.runner.call_public_method(self.contract_id, 'add_liquidity', ctx, fee)
        assert isinstance(ctx.caller_id, Address)
        return token_uid, amount, ctx.caller_id

    def swap_exact(
        self,
        *,
        token_in: TokenUid,
        token_out: TokenUid,
        fee: int,
        amount_in: int,
        amount_out: int,
        deadline: int,
        address: Address,
    ) -> SwapResult:
        ctx = self.create_context(caller_id=address, timestamp=10, actions=[
            NCDepositAction(token_uid=token_in, amount=amount_in),
            NCWithdrawalAction(token_uid=token_out, amount=amount_out),
        ])
        return self.runner.call_public_method(
            self.contract_id, 'swap_exact_tokens_for_tokens', ctx, fee=fee, deadline=deadline
        )

    def swap_for_exact(
        self,
        *,
        token_in: TokenUid,
        token_out: TokenUid,
        fee: int,
        amount_in: int,
        amount_out: int,
        deadline: int,
        address: Address,
    ) -> SwapResult:
        ctx = self.create_context(caller_id=address, timestamp=10, actions=[
            NCDepositAction(token_uid=token_in, amount=amount_in),
            NCWithdrawalAction(token_uid=token_out, amount=amount_out),
        ])
        return self.runner.call_public_method(
            self.contract_id, 'swap_tokens_for_exact_tokens', ctx, fee=fee, deadline=deadline
        )

    def remove_liquidity(
        self,
        *,
        token_a: TokenUid,
        token_b: TokenUid,
        fee: int,
        amount_a: int,
        amount_b: int,
        address: Address,
    ) -> tuple[TokenUid, Amount, Address]:
        ctx = self.create_context(caller_id=address, actions=[
            NCWithdrawalAction(token_uid=token_a, amount=amount_a),
            NCWithdrawalAction(token_uid=token_b, amount=amount_b),
        ], timestamp=10)
        token_uid, amount = self.runner.call_public_method(self.contract_id, 'remove_liquidity', ctx, fee)
        assert isinstance(ctx.caller_id, Address)
        return token_uid, amount, ctx.caller_id

    def test_pause(self) -> None:
        assert not self.runner.call_view_method(self.contract_id, 'is_paused')
        with pytest.raises(Unauthorized, match='Only owner can pause'):
            self.runner.call_public_method(self.contract_id, 'pause', self.create_context())

        self.runner.call_public_method(self.contract_id, 'pause', self.create_context(caller_id=self.owner))
        assert self.runner.call_view_method(self.contract_id, 'is_paused')

        msg = 'Contract is paused'

        with pytest.raises(InvalidState, match=msg):
            self.runner.call_public_method(self.contract_id, 'create_pool', self.create_context(), fee=0)

        with pytest.raises(InvalidState, match=msg):
            self.runner.call_public_method(self.contract_id, 'add_liquidity', self.create_context(), fee=0)

        with pytest.raises(InvalidState, match=msg):
            self.runner.call_public_method(self.contract_id, 'remove_liquidity', self.create_context(), fee=0)

        with pytest.raises(InvalidState, match=msg):
            self.runner.call_public_method(
                self.contract_id, 'add_liquidity_single_token', self.create_context(), token_out=self.token_a, fee=0
            )

        with pytest.raises(InvalidState, match=msg):
            self.runner.call_public_method(
                self.contract_id, 'remove_liquidity_single_token', self.create_context(), pool_key='', percentage=0
            )

        with pytest.raises(InvalidState, match=msg):
            self.runner.call_public_method(
                self.contract_id, 'swap_exact_tokens_for_tokens', self.create_context(), deadline=0, fee=0
            )

        with pytest.raises(InvalidState, match=msg):
            self.runner.call_public_method(
                self.contract_id, 'swap_tokens_for_exact_tokens', self.create_context(), deadline=0, fee=0
            )

        with pytest.raises(InvalidState, match=msg):
            self.runner.call_public_method(
                self.contract_id, 'swap_exact_tokens_for_tokens_through_path', self.create_context(), path_str='',
                deadline=0
            )

        with pytest.raises(InvalidState, match=msg):
            self.runner.call_public_method(
                self.contract_id, 'swap_tokens_for_exact_tokens_through_path', self.create_context(), path_str='',
                deadline=0
            )

        with pytest.raises(InvalidState, match=msg):
            self.runner.call_public_method(self.contract_id, 'withdraw_cashback', self.create_context(), pool_key='')

        with pytest.raises(Unauthorized, match='Only owner can unpause'):
            self.runner.call_public_method(self.contract_id, 'unpause', self.create_context())

        self.runner.call_public_method(self.contract_id, 'unpause', self.create_context(caller_id=self.owner))
        assert not self.runner.call_view_method(self.contract_id, 'is_paused')

    def test_create_pool(self) -> None:
        fee = 5
        pool_key = f'{self.token_a.hex()}/{self.token_b.hex()}/{fee}'

        with pytest.raises(KeyError):
            self.get_pool_state(pool_key)

        actual_pool_key, _ = self.create_pool(
            token_a=self.token_a, token_b=self.token_b, fee=fee, reserve_a=1000, reserve_b=2000
        )
        assert actual_pool_key == pool_key

        # Inverted order should fail
        with pytest.raises(PoolExists, match='Pool already exists'):
            self.create_pool(token_a=self.token_b, token_b=self.token_a, fee=fee, reserve_a=1000, reserve_b=2000)

        with pytest.raises(NCFail) as e:
            self.create_pool(token_a=self.token_a, token_b=self.token_c, fee=-1, reserve_a=1000, reserve_b=2000)
        assert isinstance(e.value.__cause__, ValueError)
        assert e.value.__cause__.args[0] == 'below lower bound'

        with pytest.raises(InvalidFee, match='Fee too high'):
            self.create_pool(token_a=self.token_a, token_b=self.token_c, fee=51, reserve_a=1000, reserve_b=2000)

        state = self.get_pool_state(pool_key)

        assert state.token_a == self.token_a
        assert state.token_b == self.token_b
        assert state.reserve_a == Amount(1000)
        assert state.reserve_b == Amount(2000)
        assert state.fee_numerator == Amount(fee)
        assert state.fee_denominator == Amount(1000)
        assert state.total_liquidity == Amount(141400000000000001414000)
        assert state.total_change_a == Amount(0)
        assert state.total_change_b == Amount(0)
        assert state.transactions == Amount(0)
        assert state.volume_a == Amount(0)
        assert state.volume_b == Amount(0)

    def test_add_remove_liquidity(self) -> None:
        contract = self.get_contract()

        fee1, fee2 = 0, 1
        reserve_a1, reserve_b1 = 1000, 2000
        reserve_a2, reserve_b2 = 200, 400

        pool_key1, creator1 = self.create_pool(
            token_a=self.token_a, token_b=self.token_b, fee=fee1, reserve_a=reserve_a1, reserve_b=reserve_b1
        )
        pool_key2, creator2 = self.create_pool(
            token_a=self.token_a, token_b=self.token_b, fee=fee2, reserve_a=reserve_a2, reserve_b=reserve_b2
        )

        pool1 = self.get_pool_state(pool_key1)
        pool2 = self.get_pool_state(pool_key2)

        assert pool1.total_liquidity == 141400000000000001414000
        assert contract.pool_user_liquidity[pool_key1][creator1] == 141400000000000000000000

        assert pool2.total_liquidity == 28200000000000000282000
        assert contract.pool_user_liquidity[pool_key2][creator2] == 28200000000000000000000

        token_uid, amount, adder = self.add_liquidity(
            token_a=self.token_a, token_b=self.token_b, fee=fee2, amount_a=reserve_a1 - reserve_a2,
            amount_b=reserve_b1 - reserve_b2 + 150,
        )
        assert token_uid == self.token_b
        assert amount == 150

        # Added liquidity to pool2 so it should be equivalent to pool1
        pool2 = self.get_pool_state(pool_key2)
        assert pool2.total_liquidity == 141000000000000001414000 - 4000  # TODO: Why -4000?
        assert contract.pool_change[pool_key2][adder] == (0, 150)
        assert contract.pool_user_liquidity[pool_key2][adder] == (
            141400000000000000000000 - 28200000000000000000000 - 399999999999998872000
        )  # TODO: Why -399999999999998872000?

        token_uid, amount, adder = self.remove_liquidity(
            token_a=self.token_a, token_b=self.token_b, fee=fee2, amount_a=reserve_a1 - reserve_a2,
            amount_b=reserve_b1 - reserve_b2 - 22, address=adder,
        )
        assert token_uid == self.token_b
        assert amount == 22

        # Removed liquidity from pool2 so it should be equivalent to the starting state
        pool2 = self.get_pool_state(pool_key2)
        assert pool2.total_liquidity == 28200000000000000282000
        assert contract.pool_change[pool_key2][adder] == (0, 172)
        assert contract.pool_user_liquidity[pool_key2][adder] == 0

    def test_remove_liquidity_insufficient(self) -> None:
        pool_key, creator = self.create_pool(
            token_a=self.token_a, token_b=self.token_b, fee=0, reserve_a=1000, reserve_b=2000
        )

        with pytest.raises(InvalidAction, match='Insufficient liquidity: 999 < 1500'):
            self.remove_liquidity(
                token_a=self.token_a, token_b=self.token_b, fee=0, amount_a=1500, amount_b=2000, address=creator
            )

        with pytest.raises(InvalidAction, match='Insufficient token B amount'):
            self.remove_liquidity(
                token_a=self.token_a, token_b=self.token_b, fee=0, amount_a=999, amount_b=2500, address=creator
            )

    def test_add_liquidity_single_token(self) -> None:
        fee = 5
        # Increased pool reserves 5x to stay under 5% price impact limit
        pool_key, _ = self.create_pool(
            token_a=self.token_a, token_b=self.token_b, fee=fee, reserve_a=5000, reserve_b=10000
        )

        amount_in = 300
        quote = self.runner.call_view_method(
            self.contract_id, 'quote_add_liquidity_single_token', token_in=self.token_b, amount_in=amount_in,
            token_out=self.token_a, fee=fee
        )

        # Updated for 5x pool reserves (5000/10000 instead of 1000/2000)
        assert quote.token_a_used == 72
        assert quote.token_b_used == 148
        assert quote.excess_token == self.token_b.hex()
        assert quote.swap_amount == 148
        assert quote.swap_output == 72

        ctx = self.create_context(actions=[NCDepositAction(token_uid=self.token_b, amount=amount_in)], timestamp=10)
        token_uid, amount = self.runner.call_public_method(
            self.contract_id, 'add_liquidity_single_token', ctx, token_out=self.token_a, fee=fee,
        )
        assert token_uid == self.token_b
        assert amount == 4

        state = self.get_pool_state(pool_key)

        # Updated for 5x pool reserves
        assert state.reserve_a == 5000
        assert state.reserve_b == 10296
        assert state.total_change_a == 0
        assert state.total_change_b == 4

    def test_remove_liquidity_single_token(self) -> None:
        fee = 5
        # Increased pool reserves 10x and reduced percentage to 2% (from 10%) to stay under 5% price impact
        pool_key, creator = self.create_pool(
            token_a=self.token_a, token_b=self.token_b, fee=fee, reserve_a=10000000, reserve_b=20000000
        )

        percentage = 200  # 2% instead of 10%
        quote = self.runner.call_view_method(
            self.contract_id, 'quote_remove_liquidity_single_token_percentage', user_address=creator,
            pool_key=pool_key, token_out=self.token_b, percentage=percentage
        )

        # Updated for 10x pool reserves with 2% removal (instead of original 1M/2M pool with 10%)
        assert quote.amount_out == 782426
        assert quote.swap_amount == 199999
        assert quote.swap_output == 382427
        assert quote.token_a_withdrawn == 199999
        assert quote.token_b_withdrawn == 399999

        ctx = self.create_context(
            actions=[NCWithdrawalAction(token_uid=self.token_b, amount=200000)], caller_id=creator, timestamp=10
        )
        amount = self.runner.call_public_method(
            self.contract_id, 'remove_liquidity_single_token', ctx, pool_key=pool_key, percentage=percentage,
        )
        assert amount == 200000

        state = self.get_pool_state(pool_key)

        assert state.reserve_a == 10000000
        assert state.reserve_b == 20000000 - 782426
        assert state.total_change_a == 0
        assert state.total_change_b == 782426 - 200000

    def _test_swap_exact_tokens_for_tokens(self, *, fee: int, deadline: int) -> tuple[str, SwapResult]:
        pool_key, creator = self.create_pool(
            token_a=self.token_a, token_b=self.token_b, fee=fee, reserve_a=1000000, reserve_b=2000000
        )

        result = self.swap_exact(
            token_in=self.token_a, token_out=self.token_b, fee=fee, amount_in=1000, amount_out=1500, deadline=deadline,
            address=creator
        )

        return pool_key, result

    def test_swap_exact_tokens_for_tokens_deadline(self) -> None:
        with pytest.raises(NCFail) as e:
            self._test_swap_exact_tokens_for_tokens(fee=0, deadline=9)
        assert isinstance(e.value.__cause__, AssertionError)
        assert e.value.__cause__.args[0] == 'Transaction expired: block timestamp 10 > deadline 9'

    def test_swap_exact_tokens_for_tokens_fee0(self) -> None:
        pool_key, result = self._test_swap_exact_tokens_for_tokens(fee=0, deadline=10)
        assert result.amount_in == 1000
        assert result.amount_out == 1998
        assert result.change_in == 498
        assert result.token_in == self.token_a
        assert result.token_out == self.token_b

        state = self.get_pool_state(pool_key)
        assert state.reserve_a == 1000000 + 1000
        assert state.reserve_b == 2000000 - 1998
        assert state.total_change_a == 0
        assert state.total_change_b == 498

    def test_swap_exact_tokens_for_tokens_fee1(self) -> None:
        pool_key, result = self._test_swap_exact_tokens_for_tokens(fee=1, deadline=10)
        assert result.amount_in == 1000
        assert result.amount_out == 1996
        assert result.change_in == 496
        assert result.token_in == self.token_a
        assert result.token_out == self.token_b

        state = self.get_pool_state(pool_key)
        assert state.reserve_a == 1000000 + 1000
        assert state.reserve_b == 2000000 - 1996
        assert state.total_change_a == 0
        assert state.total_change_b == 496

    def _test_swap_tokens_for_exact_tokens(self, *, fee: int, deadline: int) -> tuple[str, SwapResult]:
        pool_key, creator = self.create_pool(
            token_a=self.token_a, token_b=self.token_b, fee=fee, reserve_a=1000000, reserve_b=2000000
        )

        result = self.swap_for_exact(
            token_in=self.token_a, token_out=self.token_b, fee=fee, amount_in=1500, amount_out=2000, deadline=deadline,
            address=creator
        )

        return pool_key, result

    def test_swap_tokens_for_exact_tokens_deadline(self) -> None:
        with pytest.raises(NCFail) as e:
            self._test_swap_tokens_for_exact_tokens(fee=0, deadline=9)
        assert isinstance(e.value.__cause__, AssertionError)
        assert e.value.__cause__.args[0] == 'Transaction expired: block timestamp 10 > deadline 9'

    def test_swap_tokens_for_exact_tokens_fee0(self) -> None:
        pool_key, result = self._test_swap_tokens_for_exact_tokens(fee=0, deadline=10)
        assert result.amount_in == 1500
        assert result.amount_out == 2000
        assert result.change_in == 498
        assert result.token_in == self.token_a
        assert result.token_out == self.token_b

        state = self.get_pool_state(pool_key)
        assert state.reserve_a == 1000000 + 1002
        assert state.reserve_b == 2000000 - 2000
        assert state.total_change_a == 498
        assert state.total_change_b == 0

    def test_swap_tokens_for_exact_tokens_fee1(self) -> None:
        pool_key, result = self._test_swap_tokens_for_exact_tokens(fee=1, deadline=10)
        assert result.amount_in == 1500
        assert result.amount_out == 2000
        assert result.change_in == 497
        assert result.token_in == self.token_a
        assert result.token_out == self.token_b

        state = self.get_pool_state(pool_key)
        assert state.reserve_a == 1000000 + 1003
        assert state.reserve_b == 2000000 - 2000
        assert state.total_change_a == 497
        assert state.total_change_b == 0
