import pytest

from hathor import Address, NCDepositAction, NCFail, NCWithdrawalAction, TokenUid
from hathor_tests.nanocontracts.blueprints.unittest import BlueprintTestCase
from hathor.nanocontracts.blueprints.dozer_pool_manager import (
    DozerPoolManager,
    PoolState,
    SwapResult,
)


class TestDozerPoolManagerPathSwaps(BlueprintTestCase):
    def setUp(self) -> None:
        super().setUp()

        self.blueprint_id = self._register_blueprint_class(DozerPoolManager)
        self.contract_id = self.gen_random_contract_id()

        self.token_a = self.gen_random_token_uid()
        self.token_b = self.gen_random_token_uid()
        self.token_c = self.gen_random_token_uid()
        self.token_d = self.gen_random_token_uid()

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

    def swap_exact_through_path(
        self,
        *,
        path_str: str,
        token_in: TokenUid,
        token_out: TokenUid,
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
            self.contract_id, 'swap_exact_tokens_for_tokens_through_path',
            ctx, path_str=path_str, deadline=deadline
        )

    def swap_for_exact_through_path(
        self,
        *,
        path_str: str,
        token_in: TokenUid,
        token_out: TokenUid,
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
            self.contract_id, 'swap_tokens_for_exact_tokens_through_path',
            ctx, path_str=path_str, deadline=deadline
        )

    def _test_swap_exact_through_path_single_hop(self, *, fee: int, deadline: int) -> tuple[str, SwapResult]:
        pool_key, creator = self.create_pool(
            token_a=self.token_a, token_b=self.token_b, fee=fee, reserve_a=1000000, reserve_b=2000000
        )

        result = self.swap_exact_through_path(
            path_str=pool_key,
            token_in=self.token_a, token_out=self.token_b,
            amount_in=1000, amount_out=1500, deadline=deadline,
            address=creator
        )

        return pool_key, result

    def test_swap_exact_through_path_deadline(self) -> None:
        with pytest.raises(NCFail) as e:
            self._test_swap_exact_through_path_single_hop(fee=0, deadline=9)
        assert isinstance(e.value.__cause__, AssertionError)
        assert e.value.__cause__.args[0] == 'Transaction expired: block timestamp 10 > deadline 9'

    def test_swap_exact_through_path_single_hop_fee0(self) -> None:
        pool_key, result = self._test_swap_exact_through_path_single_hop(fee=0, deadline=10)
        assert result.amount_in == 1000
        assert result.amount_out == 1500  # TODO: swap_exact_tokens_for_tokens returns 1998 here, which is the correct amount_out, while this methods returns the withdrawal action amount
        assert result.change_in == 498
        assert result.token_in == self.token_a
        assert result.token_out == self.token_b

        state = self.get_pool_state(pool_key)
        assert state.reserve_a == 1000000 + 1000
        assert state.reserve_b == 2000000 - 1998
        assert state.total_change_a == 0
        assert state.total_change_b == 498

    def test_swap_exact_through_path_single_hop_fee1(self) -> None:
        pool_key, result = self._test_swap_exact_through_path_single_hop(fee=1, deadline=10)
        assert result.amount_in == 1000
        assert result.amount_out == 1500
        assert result.change_in == 496
        assert result.token_in == self.token_a
        assert result.token_out == self.token_b

        state = self.get_pool_state(pool_key)
        assert state.reserve_a == 1000000 + 1000
        assert state.reserve_b == 2000000 - 1996
        assert state.total_change_a == 0
        assert state.total_change_b == 496

    def _test_swap_exact_through_path_two_hop(
        self, *, fee1: int, fee2: int, deadline: int
    ) -> tuple[str, str, SwapResult]:
        pool_key1, creator = self.create_pool(
            token_a=self.token_a, token_b=self.token_b, fee=fee1, reserve_a=1000000, reserve_b=2000000
        )

        pool_key2, _ = self.create_pool(
            token_a=self.token_b, token_b=self.token_c, fee=fee2, reserve_a=2000000, reserve_b=3000000
        )

        path_str = f"{pool_key1},{pool_key2}"

        result = self.swap_exact_through_path(
            path_str=path_str,
            token_in=self.token_a, token_out=self.token_c,
            amount_in=1000, amount_out=2000, deadline=deadline,
            address=creator
        )

        return pool_key1, pool_key2, result

    def test_swap_exact_through_path_two_hop_fee0(self) -> None:
        pool_key1, pool_key2, result = self._test_swap_exact_through_path_two_hop(fee1=0, fee2=0, deadline=10)
        assert result.amount_in == 1000
        assert result.amount_out == 2000
        assert result.change_in == 994
        assert result.token_in == self.token_a
        assert result.token_out == self.token_c

        state1 = self.get_pool_state(pool_key1)
        assert state1.reserve_a == 1000000 + 1000
        assert state1.reserve_b == 2000000 - 1998
        assert state1.total_change_a == 0
        assert state1.total_change_b == 0

        state2 = self.get_pool_state(pool_key2)
        assert state2.reserve_a == 2000000 + 1998
        assert state2.reserve_b == 3000000 - 2994
        assert state2.total_change_a == 0
        assert state2.total_change_b == 994

    def test_swap_exact_through_path_two_hop_mixed_fees(self) -> None:
        pool_key1, pool_key2, result = self._test_swap_exact_through_path_two_hop(fee1=1, fee2=5, deadline=10)
        assert result.amount_in == 1000
        assert result.amount_out == 2000
        assert result.change_in == 976
        assert result.token_in == self.token_a
        assert result.token_out == self.token_c

        state1 = self.get_pool_state(pool_key1)
        assert state1.reserve_a == 1000000 + 1000
        assert state1.reserve_b == 2000000 - 1996

        state2 = self.get_pool_state(pool_key2)
        assert state2.reserve_a == 2000000 + 1996
        assert state2.reserve_b == 3000000 - 2976
        assert state2.total_change_b == 976

    def _test_swap_exact_through_path_three_hop(
        self, *, fee1: int, fee2: int, fee3: int, deadline: int
    ) -> tuple[str, str, str, SwapResult]:
        pool_key1, creator = self.create_pool(
            token_a=self.token_a, token_b=self.token_b, fee=fee1, reserve_a=1000000, reserve_b=2000000
        )

        pool_key2, _ = self.create_pool(
            token_a=self.token_b, token_b=self.token_c, fee=fee2, reserve_a=2000000, reserve_b=3000000
        )

        pool_key3, _ = self.create_pool(
            token_a=self.token_c, token_b=self.token_d, fee=fee3, reserve_a=3000000, reserve_b=4000000
        )

        path_str = f"{pool_key1},{pool_key2},{pool_key3}"

        result = self.swap_exact_through_path(
            path_str=path_str,
            token_in=self.token_a, token_out=self.token_d,
            amount_in=1000, amount_out=3000, deadline=deadline,
            address=creator
        )

        return pool_key1, pool_key2, pool_key3, result

    def test_swap_exact_through_path_three_hop_fee0(self) -> None:
        pool_key1, pool_key2, pool_key3, result = self._test_swap_exact_through_path_three_hop(
            fee1=0, fee2=0, fee3=0, deadline=10
        )
        assert result.amount_in == 1000
        assert result.amount_out == 3000
        assert result.change_in == 988
        assert result.token_in == self.token_a
        assert result.token_out == self.token_d

        state1 = self.get_pool_state(pool_key1)
        assert state1.reserve_a == 1000000 + 1000
        assert state1.reserve_b == 2000000 - 1998

        state2 = self.get_pool_state(pool_key2)
        assert state2.reserve_a == 2000000 + 1998
        assert state2.reserve_b == 3000000 - 2994

        state3 = self.get_pool_state(pool_key3)
        assert state3.reserve_a == 3000000 + 2994
        assert state3.reserve_b == 4000000 - 3988
        assert state3.total_change_b == 988

    def _test_swap_for_exact_through_path_single_hop(self, *, fee: int, deadline: int) -> tuple[str, SwapResult]:
        pool_key, creator = self.create_pool(
            token_a=self.token_a, token_b=self.token_b, fee=fee, reserve_a=1000000, reserve_b=2000000
        )

        result = self.swap_for_exact_through_path(
            path_str=pool_key,
            token_in=self.token_a, token_out=self.token_b,
            amount_in=1500, amount_out=2000, deadline=deadline,
            address=creator
        )

        return pool_key, result

    def test_swap_for_exact_through_path_deadline(self) -> None:
        with pytest.raises(NCFail) as e:
            self._test_swap_for_exact_through_path_single_hop(fee=0, deadline=9)
        assert isinstance(e.value.__cause__, AssertionError)
        assert e.value.__cause__.args[0] == 'Transaction expired: block timestamp 10 > deadline 9'

    def test_swap_for_exact_through_path_single_hop_fee0(self) -> None:
        pool_key, result = self._test_swap_for_exact_through_path_single_hop(fee=0, deadline=10)
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

    def test_swap_for_exact_through_path_single_hop_fee1(self) -> None:
        pool_key, result = self._test_swap_for_exact_through_path_single_hop(fee=1, deadline=10)
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

    def _test_swap_for_exact_through_path_two_hop(
        self, *, fee1: int, fee2: int, deadline: int
    ) -> tuple[str, str, SwapResult]:
        pool_key1, creator = self.create_pool(
            token_a=self.token_a, token_b=self.token_b, fee=fee1, reserve_a=1000000, reserve_b=2000000
        )

        pool_key2, _ = self.create_pool(
            token_a=self.token_b, token_b=self.token_c, fee=fee2, reserve_a=2000000, reserve_b=3000000
        )

        path_str = f"{pool_key1},{pool_key2}"

        result = self.swap_for_exact_through_path(
            path_str=path_str,
            token_in=self.token_a, token_out=self.token_c,
            amount_in=2000, amount_out=3000, deadline=deadline,
            address=creator
        )

        return pool_key1, pool_key2, result

    def test_swap_for_exact_through_path_two_hop_fee0(self) -> None:
        pool_key1, pool_key2, result = self._test_swap_for_exact_through_path_two_hop(fee1=0, fee2=0, deadline=10)
        assert result.amount_in == 2000
        assert result.amount_out == 3000
        assert result.change_in == 997
        assert result.token_in == self.token_a
        assert result.token_out == self.token_c

        state1 = self.get_pool_state(pool_key1)
        assert state1.reserve_a == 1000000 + 1003
        assert state1.reserve_b == 2000000 - 2003
        assert state1.total_change_a == 997

        state2 = self.get_pool_state(pool_key2)
        assert state2.reserve_a == 2000000 + 2003
        assert state2.reserve_b == 3000000 - 3000

    def test_swap_for_exact_through_path_two_hop_mixed_fees(self) -> None:
        pool_key1, pool_key2, result = self._test_swap_for_exact_through_path_two_hop(fee1=1, fee2=5, deadline=10)
        assert result.amount_in == 2000
        assert result.amount_out == 3000
        assert result.change_in == 991
        assert result.token_in == self.token_a
        assert result.token_out == self.token_c

        state1 = self.get_pool_state(pool_key1)
        assert state1.reserve_a == 1000000 + 1009
        assert state1.reserve_b == 2000000 - 2013
        assert state1.total_change_a == 991

    def _test_swap_for_exact_through_path_three_hop(
        self, *, fee1: int, fee2: int, fee3: int, deadline: int
    ) -> tuple[str, str, str, SwapResult]:
        pool_key1, creator = self.create_pool(
            token_a=self.token_a, token_b=self.token_b, fee=fee1, reserve_a=1000000, reserve_b=2000000
        )

        pool_key2, _ = self.create_pool(
            token_a=self.token_b, token_b=self.token_c, fee=fee2, reserve_a=2000000, reserve_b=3000000
        )

        pool_key3, _ = self.create_pool(
            token_a=self.token_c, token_b=self.token_d, fee=fee3, reserve_a=3000000, reserve_b=4000000
        )

        path_str = f"{pool_key1},{pool_key2},{pool_key3}"

        result = self.swap_for_exact_through_path(
            path_str=path_str,
            token_in=self.token_a, token_out=self.token_d,
            amount_in=2000, amount_out=4000, deadline=deadline,
            address=creator
        )

        return pool_key1, pool_key2, pool_key3, result

    def test_swap_for_exact_through_path_three_hop_fee0(self) -> None:
        pool_key1, pool_key2, pool_key3, result = self._test_swap_for_exact_through_path_three_hop(
            fee1=0, fee2=0, fee3=0, deadline=10
        )
        assert result.amount_in == 2000
        assert result.amount_out == 4000
        assert result.change_in == 996
        assert result.token_in == self.token_a
        assert result.token_out == self.token_d

        state1 = self.get_pool_state(pool_key1)
        assert state1.reserve_a == 1000000 + 1004
        assert state1.reserve_b == 2000000 - 2005
        assert state1.total_change_a == 996

        state2 = self.get_pool_state(pool_key2)
        assert state2.reserve_a == 2000000 + 2005
        assert state2.reserve_b == 3000000 - 3004

        state3 = self.get_pool_state(pool_key3)
        assert state3.reserve_a == 3000000 + 3004
        assert state3.reserve_b == 4000000 - 4000
