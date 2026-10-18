import pytest

from hathor import Address, NCDepositAction, NCFail, NCWithdrawalAction, TokenUid
from hathor_tests.nanocontracts.blueprints.unittest import BlueprintTestCase
from hathor.nanocontracts.blueprints.dozer_pool_manager import (
    DozerPoolManager,
    PoolNotFound,
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
        # Routing is now restricted to signed pools; sign as the owner (an authorized
        # signer) so these well-formed paths remain routable.
        sign_ctx = self.create_context(caller_id=self.owner, timestamp=1)
        self.runner.call_public_method(
            self.contract_id, 'sign_pool', sign_ctx, token_a, token_b, fee
        )
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

    # --- Pool existence checks on path swaps and quote views -------------------------

    def _create_chain_of_pools(self) -> tuple[str, str, str, Address]:
        pool_ab, creator = self.create_pool(
            token_a=self.token_a, token_b=self.token_b, fee=0, reserve_a=1000000, reserve_b=1000000
        )
        pool_bc, _ = self.create_pool(
            token_a=self.token_b, token_b=self.token_c, fee=0, reserve_a=1000000, reserve_b=1000000
        )
        pool_cd, _ = self.create_pool(
            token_a=self.token_c, token_b=self.token_d, fee=0, reserve_a=1000000, reserve_b=1000000
        )
        return pool_ab, pool_bc, pool_cd, creator

    @staticmethod
    def _missing(pool_key: str) -> str:
        """Same token pair as an existing pool, but with a fee tier that was never created."""
        token_a, token_b, _fee = pool_key.split("/")
        return f"{token_a}/{token_b}/7"

    def _assert_paths_reject_missing_pool(self, swap) -> None:
        pool_ab, pool_bc, pool_cd, creator = self._create_chain_of_pools()
        cases = [
            (self._missing(pool_ab), self.token_b),
            (f"{pool_ab},{self._missing(pool_bc)}", self.token_c),
            (f"{pool_ab},{pool_bc},{self._missing(pool_cd)}", self.token_d),
        ]
        for path_str, token_out in cases:
            with pytest.raises(PoolNotFound):
                swap(
                    path_str=path_str,
                    token_in=self.token_a, token_out=token_out,
                    amount_in=1000, amount_out=1, deadline=10,
                    address=creator,
                )

    def test_swap_exact_through_path_rejects_missing_pool_at_any_hop(self) -> None:
        self._assert_paths_reject_missing_pool(self.swap_exact_through_path)

    def test_swap_for_exact_through_path_rejects_missing_pool_at_any_hop(self) -> None:
        self._assert_paths_reject_missing_pool(self.swap_for_exact_through_path)

    def test_front_quote_add_liquidity_rejects_missing_pool(self) -> None:
        pool_ab, _creator = self.create_pool(
            token_a=self.token_a, token_b=self.token_b, fee=0, reserve_a=1000000, reserve_b=1000000
        )
        for method in ("front_quote_add_liquidity_in", "front_quote_add_liquidity_out"):
            # Existing pool works
            self.runner.call_view_method(self.contract_id, method, 1000, self.token_a, pool_ab)
            with pytest.raises(PoolNotFound):
                self.runner.call_view_method(
                    self.contract_id, method, 1000, self.token_a, self._missing(pool_ab)
                )


    # --- Deterministic path selection ------------------------------------------------

    def test_path_finding_breaks_ties_by_token_uid(self) -> None:
        """Two equally good routes A->B->D and A->C->D: always pick the one via the smaller token uid."""
        for token_a, token_b in (
            (self.token_a, self.token_b), (self.token_b, self.token_d),
            (self.token_a, self.token_c), (self.token_c, self.token_d),
        ):
            self.create_pool(token_a=token_a, token_b=token_b, fee=0, reserve_a=1000000, reserve_b=1000000)

        via, other = sorted([self.token_b, self.token_c])

        info = self.runner.call_view_method(
            self.contract_id, "find_best_swap_path", 1000, self.token_a, self.token_d, 3
        )
        assert via.hex() in info.path and other.hex() not in info.path

        info_exact = self.runner.call_view_method(
            self.contract_id, "find_best_swap_path_exact_output", 1000, self.token_a, self.token_d, 3
        )
        assert via.hex() in info_exact.path and other.hex() not in info_exact.path


class TestDozerPoolManagerPagination(BlueprintTestCase):
    """Paginated variants of the all_pools-iterating views (bounded view cost)."""

    HTR = TokenUid(b'\x00')

    def setUp(self) -> None:
        super().setUp()
        self.blueprint_id = self._register_blueprint_class(DozerPoolManager)
        self.contract_id = self.gen_random_contract_id()
        ctx = self.create_context()
        self.runner.create_contract(self.contract_id, self.blueprint_id, ctx)
        assert isinstance(ctx.caller_id, Address)
        self.owner = ctx.caller_id

    def view(self, method: str, *args):
        return self.runner.call_view_method(self.contract_id, method, *args)

    def create_pool(self, token_a: TokenUid, token_b: TokenUid, fee: int = 0, sign: bool = False,
                    reserve_a: int = 1000000, reserve_b: int = 1000000) -> tuple[str, Address]:
        ctx = self.create_context(actions=[
            NCDepositAction(token_uid=token_a, amount=reserve_a),
            NCDepositAction(token_uid=token_b, amount=reserve_b),
        ], timestamp=1)
        pool_key = self.runner.call_public_method(self.contract_id, 'create_pool', ctx, fee)
        assert isinstance(ctx.caller_id, Address)
        if sign:
            sign_ctx = self.create_context(caller_id=self.owner, timestamp=1)
            self.runner.call_public_method(self.contract_id, 'sign_pool', sign_ctx, token_a, token_b, fee)
        return pool_key, ctx.caller_id

    def create_many_pools(self, n: int, sign_every: int = 0) -> list[str]:
        hub = self.gen_random_token_uid()
        keys = []
        for i in range(n):
            key, _ = self.create_pool(hub, self.gen_random_token_uid(), sign=bool(sign_every) and i % sign_every == 0)
            keys.append(key)
        return keys

    def collect(self, method: str, *args, page: int, total: int | None = None) -> list:
        """Page through a list-returning view; returns the concatenation of all pages."""
        if total is None:
            total = self.view('get_pool_count')
        out: list = []
        for skip in range(0, total, page):
            out.extend(self.view(method, *args, skip, page))
        return out

    def test_pool_count(self) -> None:
        assert self.view('get_pool_count') == 0
        self.create_many_pools(3)
        assert self.view('get_pool_count') == 3

    def test_pools_page_walks_all_pools_once_in_order(self) -> None:
        keys = self.create_many_pools(7)
        full = self.view('get_all_pools')
        assert full == keys
        for page in (1, 2, 3, 7, 100):
            assert self.collect('get_pools_page', page=page) == full
        assert self.view('get_pools_page', 2, 3) == full[2:5]
        # last partial page
        assert self.view('get_pools_page', 6, 3) == full[6:]

    def test_pools_page_limit_is_capped(self) -> None:
        self.create_many_pools(101 + 4)
        full = self.view('get_all_pools')
        assert len(full) == 105
        page = self.view('get_pools_page', 0, 1_000_000)
        assert len(page) == 100
        assert page == full[:100]
        assert self.view('get_pools_page', 100, 1_000_000) == full[100:]

    def test_pools_page_skip_beyond_end_is_empty(self) -> None:
        self.create_many_pools(3)
        assert self.view('get_pools_page', 3, 10) == []
        assert self.view('get_pools_page', 1000, 10) == []
        # also on an empty contract
        other_id = self.gen_random_contract_id()
        self.runner.create_contract(other_id, self.blueprint_id, self.create_context())
        assert self.runner.call_view_method(other_id, 'get_pools_page', 0, 10) == []

    def test_page_args_validated(self) -> None:
        self.create_many_pools(2)
        user = self.owner
        calls = [
            ('get_pools_page', ()),
            ('get_signed_pools_page', ()),
            ('get_user_pools_page', (user,)),
            ('get_user_positions_page', (user,)),
            ('get_token_prices_in_htr_page', ()),
            ('get_token_prices_in_usd_page', ()),
        ]
        for method, args in calls:
            for skip, limit in ((-1, 10), (0, 0), (0, -5), (-3, -3)):
                with pytest.raises(NCFail):
                    self.view(method, *args, skip, limit)
            # valid arguments do not raise
            self.view(method, *args, 0, 10)

    def test_signed_pools_page_matches_non_paginated(self) -> None:
        self.create_many_pools(9, sign_every=3)
        full = self.view('get_signed_pools')
        assert len(full) == 3
        for page in (1, 2, 4, 100):
            assert self.collect('get_signed_pools_page', page=page) == full

    def test_user_pools_and_positions_page_match_non_paginated(self) -> None:
        hub = self.gen_random_token_uid()
        keys = []
        creators = []
        for _ in range(6):
            key, creator = self.create_pool(hub, self.gen_random_token_uid())
            keys.append(key)
            creators.append(creator)
        # the creator of pool 0 gets liquidity in several other pools too
        user = creators[0]
        for key in (keys[2], keys[4]):
            token_a, token_b = self.get_pool_tokens(key)
            ctx = self.create_context(caller_id=user, timestamp=2, actions=[
                NCDepositAction(token_uid=token_a, amount=1000),
                NCDepositAction(token_uid=token_b, amount=1000),
            ])
            fee = 0
            self.runner.call_public_method(self.contract_id, 'add_liquidity', ctx, fee)

        full_pools = self.view('get_user_pools', user)
        assert len(full_pools) == 3
        full_positions = self.view('get_user_positions', user)
        assert len(full_positions) == 3
        for page in (1, 2, 4, 100):
            assert self.collect('get_user_pools_page', user, page=page) == full_pools
            merged: dict = {}
            total = self.view('get_pool_count')
            for skip in range(0, total, page):
                part = self.view('get_user_positions_page', user, skip, page)
                assert not (set(part) & set(merged))  # each pool appears in exactly one page
                merged.update(part)
            assert merged == full_positions
        # a user with no positions gets nothing
        stranger = self.create_context().caller_id
        assert self.view('get_user_pools_page', stranger, 0, 100) == []
        assert self.view('get_user_positions_page', stranger, 0, 100) == {}

    def get_pool_tokens(self, pool_key: str) -> tuple[TokenUid, TokenUid]:
        pool = self.get_readonly_contract(self.contract_id).pools[pool_key]  # type: ignore[attr-defined]
        return pool.token_a, pool.token_b

    def test_token_price_pages_match_non_paginated(self) -> None:
        usd = self.gen_random_token_uid()
        usd_pool, _ = self.create_pool(self.HTR, usd, sign=True, reserve_a=1000_00, reserve_b=10000_00)
        owner_ctx = self.create_context(caller_id=self.owner, timestamp=1)
        self.runner.call_public_method(self.contract_id, 'set_htr_usd_pool', owner_ctx, self.HTR, usd, 0)
        for i in range(5):
            self.create_pool(self.HTR, self.gen_random_token_uid(), sign=True,
                             reserve_a=1000_00 + i * 100, reserve_b=5000_00)
        # an unsigned pool is not routable, so its token has no price
        self.create_pool(self.HTR, self.gen_random_token_uid(), sign=False)

        for method, full_method in (
            ('get_token_prices_in_htr_page', 'get_all_token_prices_in_htr'),
            ('get_token_prices_in_usd_page', 'get_all_token_prices_in_usd'),
        ):
            full = self.view(full_method)
            assert len(full) >= 7
            for page in (1, 2, 3, 100):
                merged: dict = {}
                for skip in range(0, self.view('get_pool_count'), page):
                    for token, price in self.view(method, skip, page).items():
                        # the same token must get the same price whichever page it shows up in
                        assert merged.setdefault(token, price) == price
                assert merged == full
        # Tokens come out in pool order (first appearance in all_pools), not in set order, so
        # every node returns the same ordering
        norm = lambda k: k.hex() if isinstance(k, (bytes, bytearray)) else str(k)
        pool_order: list = []
        for pool_key in self.view('get_pools_page', 0, 100):
            for token in pool_key.split('/')[:2]:
                if token not in pool_order:
                    pool_order.append(token)
        for method, args in (
            ('get_all_token_prices_in_htr', ()),
            ('get_all_token_prices_in_usd', ()),
            ('get_token_prices_in_htr_page', (0, 100)),
            ('get_token_prices_in_usd_page', (0, 100)),
        ):
            keys = [norm(k) for k in self.view(method, *args)]
            assert keys == [t for t in pool_order if t in keys], method

        assert self.view('get_token_prices_in_usd_page', 1000, 10) == {}
        # without an HTR-USD pool the USD page is empty
        other_id = self.gen_random_contract_id()
        self.runner.create_contract(other_id, self.blueprint_id, self.create_context())
        assert self.runner.call_view_method(other_id, 'get_token_prices_in_usd_page', 0, 10) == {}
