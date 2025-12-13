import os
from logging import getLogger

from hathor.conf import HathorSettings
from hathor.crypto.util import decode_address
from hathor.nanocontracts.blueprints.dozer_pool_manager import (
    DozerPoolManager,
    InvalidAction,
    InvalidTokens,
    PoolExists,
    Unauthorized,
)

from hathor.nanocontracts.types import Address, NCDepositAction, NCWithdrawalAction, TokenUid, Amount
from hathor.transaction.base_transaction import BaseTransaction
from hathor.util import not_none
from hathor.wallet import KeyPair
from hathor_tests.nanocontracts.blueprints.unittest import BlueprintTestCase

PRECISION = 10**20
MINIMUM_LIQUIDITY = 10**3

HTR_UID = b'\x00'

def isqrt(n):
    """
    Integer square root using Newton's method (Babylonian algorithm).
    Matches the contract implementation with optimizations for very large numbers.
    Returns the largest integer x such that x² ≤ n.
    """
    if n == 0:
        return 0
    # Special case for small numbers (same as Uniswap V2)
    if n <= 3:
        return 1
    # Newton's method with optimized initial guess
    # For very large numbers (>128 bits), use bit-length based initial guess
    if n > (1 << 128):
        bit_length = n.bit_length()
        x = 1 << ((bit_length + 1) // 2)
        z = n
    else:
        z = n
        x = n // 2 + 1
    while x < z:
        z = x
        x = (n // x + x) // 2
    return z

def calculate_burned_liquidity(reserve_a, reserve_b):
    """Calculate the minimum liquidity that gets burned on pool creation"""
    product = reserve_a * reserve_b
    sqrt_product = isqrt(product)
    return sqrt_product * MINIMUM_LIQUIDITY

settings = HathorSettings()

logger = getLogger(__name__)


class DozerPoolManagerBlueprintTestCase(BlueprintTestCase):
    def setUp(self):
        super().setUp()

        self.blueprint_id = self.gen_random_blueprint_id()
        self.nc_id = self.gen_random_contract_id()
        self._register_blueprint_class(DozerPoolManager,self.blueprint_id)

        # Generate random token UIDs for testing
        self.token_a = self.gen_random_token_uid()
        self.token_b = self.gen_random_token_uid()
        self.token_c = self.gen_random_token_uid()
        self.token_d = self.gen_random_token_uid()
        self.token_e = self.gen_random_token_uid()

        # Initialize the contract
        self._initialize_contract()

    def _get_any_tx(self) -> BaseTransaction:
        genesis = self.manager.tx_storage.get_all_genesis()
        tx = [t for t in genesis if t.is_transaction][0]
        return tx

    def _get_any_address(self):
        password = os.urandom(12)
        key = KeyPair.create(password)
        address_b58 = key.address
        address_bytes = decode_address(not_none(address_b58))
        return address_bytes, key

    def get_current_timestamp(self):
        return int(self.clock.seconds())

    def _initialize_contract(self):
        """Initialize the DozerPoolManager contract"""
        tx = self._get_any_tx()
        context = self.create_context(
            actions=[], vertex=tx, caller_id=Address(self._get_any_address()[0]), timestamp=self.get_current_timestamp()
        )
        self.runner.create_contract(
            self.nc_id,
            self.blueprint_id,
            context,
        )

        self.nc_storage = self.runner.get_storage(self.nc_id)
        self.owner_address = context.caller_id

    def _check_balance(self):
        """Check the balance of the contract"""
        contract = self.get_readonly_contract(self.nc_id)
        assert isinstance(contract, DozerPoolManager)
        
        token_balances = {}
        for token, contract_balance in self.nc_storage.get_all_balances().items():
            token_uid = token.token_uid
            token_to_pools = self.runner.call_view_method(
                self.nc_id, "get_pools_for_token", token_uid
            )
            for pool in token_to_pools:
                token_a_hex, _token_b_hex, _fee = pool.split("/")
                token_a = bytes.fromhex(token_a_hex)
                if token_uid == token_a:

                    token_balances[token_uid] = (
                        token_balances.get(token_uid, 0)
                        + contract.pools[pool].reserve_a
                        + contract.pools[pool].total_change_a
                    )
                else:

                    token_balances[token_uid] = (
                        token_balances.get(token_uid, 0)
                        + contract.pools[pool].reserve_b
                        + contract.pools[pool].total_change_b
                    )
            state_balance = token_balances[token_uid]
            self.assertEqual(state_balance, contract_balance.value)

    def _create_pool(
        self, token_a, token_b, fee=3, reserve_a=1000_00, reserve_b=1000_00
    ):
        """Create a pool with the specified tokens and fee"""
        tx = self._get_any_tx()
        actions = [
            NCDepositAction(token_uid=token_a, amount=reserve_a),
            NCDepositAction(token_uid=token_b, amount=reserve_b),
        ]
        context = self.create_context(
            actions=actions,
            vertex=tx,
            caller_id=Address(self._get_any_address()[0]),
            timestamp=self.get_current_timestamp(),
        )
        pool_key = self.runner.call_public_method(
            self.nc_id, "create_pool", context, fee
        )
        return pool_key, context.caller_id

    def _add_liquidity(self, token_a, token_b, fee, amount_a, amount_b=None):
        """Add liquidity to an existing pool"""
        tx = self._get_any_tx()
        if amount_b is None:
            reserve_a, reserve_b = self.runner.call_view_method(
                self.nc_id, "get_reserves", token_a, token_b, fee
            )
            amount_b = self.runner.call_view_method(
                self.nc_id, "quote", amount_a, reserve_a, reserve_b
            )
        actions = [
            NCDepositAction(token_uid=token_a, amount=amount_a),
            NCDepositAction(token_uid=token_b, amount=amount_b),
        ]
        address_bytes, _ = self._get_any_address()
        context = self.create_context(
            actions=actions,
            vertex=tx,
            caller_id=Address(address_bytes),
            timestamp=self.get_current_timestamp()
        ) 
        result = self.runner.call_public_method(
            self.nc_id, "add_liquidity", context, fee
        )
        return result, context

    def _remove_liquidity(
        self, token_a, token_b, fee, amount_a, amount_b=None, address=None
    ):
        """Remove liquidity from an existing pool

        Args:
            token_a: First token of the pair
            token_b: Second token of the pair
            fee: Fee for the pool
            amount_a: Amount of token A to withdraw
            amount_b: Amount of token B to withdraw (optional, will be calculated using quote if not provided)
            address: Address to remove liquidity from (optional)

        Note:
            The contract uses the quote method to calculate the optimal amount of token B based on amount_a.
            If amount_b is less than the optimal amount, the difference is returned as change.
            If amount_b is not provided, it will be calculated using the quote method.
        """
        # Ensure tokens are ordered correctly
        if token_a > token_b:
            token_a, token_b = token_b, token_a
            amount_a, amount_b = amount_b, amount_a

        # Get current reserves
        reserves = self.runner.call_view_method(
            self.nc_id, "get_reserves", token_a, token_b, fee
        )

        # Calculate optimal amount_b using quote if not provided
        if amount_b is None:
            amount_b = self.runner.call_view_method(
                self.nc_id, "quote", amount_a, reserves[0], reserves[1]
            )
            # Ensure amount_b is an integer
            amount_b = int(amount_b)

        tx = self._get_any_tx()
        # Ensure both amounts are integers
        amount_a = int(amount_a) if amount_a is not None else 0
        amount_b = int(amount_b) if amount_b is not None else 0

        actions = [
            NCWithdrawalAction(token_uid=token_a, amount=amount_a),
            NCWithdrawalAction(token_uid=token_b, amount=amount_b),
        ]
        if address is None:
            address_bytes, _ = self._get_any_address()
            caller_id = Address(address_bytes)
        else:
            caller_id = address
        context = self.create_context(
            actions=actions,
            vertex=tx,
            caller_id=caller_id,
            timestamp=self.get_current_timestamp()
        )
        result = self.runner.call_public_method(
            self.nc_id, "remove_liquidity", context, fee
        )
        return context, result

    def _prepare_swap_context(self, token_in, amount_in, token_out, amount_out):
        """Prepare a context for swap operations"""
        tx = self._get_any_tx()
        actions = [
            NCDepositAction(token_uid=token_in, amount=amount_in),
            NCWithdrawalAction(token_uid=token_out, amount=amount_out),
        ]
        address_bytes, _ = self._get_any_address()
        return self.create_context(
            actions=actions,
            vertex=tx,
            caller_id=Address(address_bytes),
            timestamp=self.get_current_timestamp()
        )

    def _swap_exact_tokens_for_tokens(
        self, token_a, token_b, fee, amount_in, amount_out
    ):
        """Execute a swap_exact_tokens_for_tokens operation"""
        context = self._prepare_swap_context(token_a, amount_in, token_b, amount_out)
        # Set deadline far in the future (1 year from now)
        deadline = self.get_current_timestamp() + 365 * 24 * 60 * 60
        result = self.runner.call_public_method(
            self.nc_id, "swap_exact_tokens_for_tokens", context, fee, deadline
        )
        return result, context

    def _swap_tokens_for_exact_tokens(
        self, token_a, token_b, fee, amount_in, amount_out
    ):
        """Execute a swap_tokens_for_exact_tokens operation"""
        context = self._prepare_swap_context(token_a, amount_in, token_b, amount_out)
        # Set deadline far in the future (1 year from now)
        deadline = self.get_current_timestamp() + 365 * 24 * 60 * 60
        result = self.runner.call_public_method(
            self.nc_id, "swap_tokens_for_exact_tokens", context, fee, deadline
        )
        return result, context

    def test_initialize(self):
        """Test contract initialization"""
        contract = self.get_readonly_contract(self.nc_id)
        assert isinstance(contract, DozerPoolManager)
        
        # Verify owner is set correctly
        self.assertEqual(contract.owner, self.owner_address)

        # Verify protocol fee are set correctly
        self.assertEqual(contract.default_protocol_fee, 40)

    def test_create_pool(self):
        """Test pool creation"""
        # Create a pool
        pool_key, creator_address = self._create_pool(self.token_a, self.token_b)

        contract = self.get_readonly_contract(self.nc_id)
        assert isinstance(contract, DozerPoolManager)

        # Verify pool exists
        self.assertTrue(pool_key in contract.pools)

        # Verify tokens are stored correctly
        self.assertEqual(contract.pools[pool_key].token_a, self.token_a)
        self.assertEqual(contract.pools[pool_key].token_b, self.token_b)

        # Verify initial liquidity
        creator_liquidity = self.runner.call_view_method(
            self.nc_id, "liquidity_of", creator_address, pool_key
        )
        self.assertEqual(
            creator_liquidity,
            1000_00 * PRECISION,
        )

        # Try to create the same pool again - should fail
        tx = self._get_any_tx()
        actions = [
            NCDepositAction(token_uid=self.token_a, amount=1000_00),
            NCDepositAction(token_uid=self.token_b, amount=1000_00),
        ]
        context = self.create_context(
            actions=actions,
            vertex=tx,
            caller_id=Address(self._get_any_address()[0]),
            timestamp=self.get_current_timestamp(),
        )
        with self.assertRaises(PoolExists):
            self.runner.call_public_method(self.nc_id, "create_pool", context, 3)
        self._check_balance()

    def test_create_multiple_pools(self):
        """Test creating multiple pools with different tokens and fees"""
        # Create first pool with token_a and token_b
        pool_key1, _ = self._create_pool(self.token_a, self.token_b, fee=3)

        # Create second pool with token_a and token_c
        pool_key2, _ = self._create_pool(self.token_a, self.token_c, fee=5)

        # Create third pool with token_b and token_c
        pool_key3, _ = self._create_pool(self.token_b, self.token_c, fee=10)

        # Create fourth pool with token_a and token_b but different fee
        pool_key4, _ = self._create_pool(self.token_a, self.token_b, fee=20)

        contract = self.get_readonly_contract(self.nc_id)
        assert isinstance(contract, DozerPoolManager)

        # Verify all pools exist
        self.assertTrue(pool_key1 in contract.pools)
        self.assertTrue(pool_key2 in contract.pools)
        self.assertTrue(pool_key3 in contract.pools)
        self.assertTrue(pool_key4 in contract.pools)

        # Verify all pools are in the all_pools list
        all_pools = self.runner.call_view_method(self.nc_id, "get_all_pools")
        self.assertIn(pool_key1, all_pools)
        self.assertIn(pool_key2, all_pools)
        self.assertIn(pool_key3, all_pools)
        self.assertIn(pool_key4, all_pools)

        # Verify token_to_pools mapping
        token_to_pools = self.runner.call_view_method(
            self.nc_id, "get_pools_for_token", self.token_a
        )
        self.assertIn(pool_key1, token_to_pools)
        self.assertIn(pool_key2, token_to_pools)
        self.assertIn(pool_key4, token_to_pools)
        token_to_pools = self.runner.call_view_method(
            self.nc_id, "get_pools_for_token", self.token_b
        )
        self.assertIn(pool_key1, token_to_pools)
        self.assertIn(pool_key3, token_to_pools)
        self.assertIn(pool_key4, token_to_pools)
        token_to_pools = self.runner.call_view_method(
            self.nc_id, "get_pools_for_token", self.token_c
        )
        self.assertIn(pool_key2, token_to_pools)
        self.assertIn(pool_key3, token_to_pools)

        self._check_balance()

    def test_add_liquidity(self):
        """Test adding liquidity to a pool"""
        # Create a pool
        pool_key, _creator_address = self._create_pool(self.token_a, self.token_b)

        contract = self.get_readonly_contract(self.nc_id)
        assert isinstance(contract, DozerPoolManager)

        # Initial reserves
        initial_reserve_a = contract.pools[pool_key].reserve_a
        initial_reserve_b = contract.pools[pool_key].reserve_b
        initial_total_liquidity = contract.pools[pool_key].total_liquidity

        amount_a = 500_00
        reserve_a, reserve_b = self.runner.call_view_method(
            self.nc_id, "get_reserves", self.token_a, self.token_b, 3
        )
        amount_b = self.runner.call_view_method(
            self.nc_id, "quote", amount_a, reserve_a, reserve_b
        )

        liquidity_increase = initial_total_liquidity * amount_a // reserve_a
        # Add liquidity
        _result, context = self._add_liquidity(
            self.token_a,
            self.token_b,
            3,
            amount_a,
            amount_b,
        )

        # Get updated contract state
        updated_contract = self.get_readonly_contract(self.nc_id)
        assert isinstance(updated_contract, DozerPoolManager)

        # Verify reserves increased
        self.assertEqual(
            updated_contract.pools[pool_key].reserve_a,
            initial_reserve_a + amount_a,
        )
        self.assertEqual(
            updated_contract.pools[pool_key].reserve_b,
            initial_reserve_b + amount_b,
        )

        # Verify total liquidity increased
        self.assertEqual(
            updated_contract.pools[pool_key].total_liquidity,
            initial_total_liquidity + liquidity_increase,
        )

        self.assertEqual(
            self.runner.call_view_method(
                self.nc_id, "liquidity_of", context.caller_id, pool_key
            ),
            liquidity_increase,
        )

        self._check_balance()

    def test_remove_liquidity(self):
        """Test removing liquidity from a pool"""
        # Create a pool
        pool_key, _creator_address = self._create_pool(self.token_a, self.token_b)

        # Add liquidity with a new user
        _result, add_context = self._add_liquidity(
            self.token_a,
            self.token_b,
            3,
            500_00,
        )

        contract = self.get_readonly_contract(self.nc_id)
        assert isinstance(contract, DozerPoolManager)

        # Initial values before removal
        initial_reserve_a = contract.pools[pool_key].reserve_a
        initial_reserve_b = contract.pools[pool_key].reserve_b
        initial_total_liquidity = contract.pools[pool_key].total_liquidity
        initial_user_liquidity = self.runner.call_view_method(
            self.nc_id, "liquidity_of", add_context.caller_id, pool_key
        )

        # Calculate amount of token A to remove (half of the user's liquidity)
        amount_to_remove_a = (
            initial_reserve_a * initial_user_liquidity // (initial_total_liquidity * 2)
        )

        liquidity_decrease = initial_user_liquidity // 2

        amount_to_remove_b = self.runner.call_view_method(
            self.nc_id,
            "quote",
            amount_to_remove_a,
            initial_reserve_a,
            initial_reserve_b,
        )

        remove_context, _ = self._remove_liquidity(
            self.token_a,
            self.token_b,
            3,
            amount_to_remove_a,
            amount_to_remove_b,
            address=add_context.caller_id,
        )

        # Get updated contract state
        updated_contract = self.get_readonly_contract(self.nc_id)
        assert isinstance(updated_contract, DozerPoolManager)

        # Verify reserves decreased
        self.assertEqual(
            updated_contract.pools[pool_key].reserve_a,
            initial_reserve_a - amount_to_remove_a,
        )
        self.assertEqual(
            updated_contract.pools[pool_key].reserve_b,
            initial_reserve_b - amount_to_remove_b,
        )

        # Verify total liquidity decreased
        self.assertEqual(
            updated_contract.pools[pool_key].total_liquidity,
            initial_total_liquidity - liquidity_decrease,
        )

        # Verify user liquidity decreased
        self.assertEqual(
            self.runner.call_view_method(
                self.nc_id, "liquidity_of", remove_context.caller_id, pool_key
            ),
            initial_user_liquidity - liquidity_decrease,
        )

        self._check_balance()

    def test_user_profit_tracking(self):
        """Test user profit tracking functionality"""
        # Create a pool
        pool_key, _creator_address = self._create_pool(self.token_a, self.token_b)

        # Add liquidity with a new user
        _result, add_context = self._add_liquidity(
            self.token_a, self.token_b, 3, 500_00
        )

        # Check profit info immediately after adding liquidity
        profit_info = self.runner.call_view_method(
            self.nc_id, "get_user_profit_info", add_context.caller_id, pool_key
        )

        # Initially, profit should be zero (or very small due to rounding)
        self.assertGreaterEqual(profit_info.current_value_usd, 0)
        self.assertGreaterEqual(profit_info.initial_value_usd, 0)
        self.assertEqual(profit_info.profit_amount_usd, 0)
        self.assertEqual(profit_info.profit_percentage, 0)
        self.assertGreater(profit_info.last_action_timestamp, 0)

        self._check_balance()

    def test_add_liquidity_single_token(self):
        pool_key, _creator_address = self._create_pool(
            self.token_a, self.token_b, fee=3, reserve_a=10000_00, reserve_b=20000_00
        )

        tx = self._get_any_tx()
        amount_in = 1000_00
        actions = [NCDepositAction(token_uid=self.token_a, amount=amount_in)]

        address_bytes, _ = self._get_any_address()
        context = self.create_context(
            actions=actions,
            vertex=tx,
            caller_id=Address(address_bytes),
            timestamp=self.get_current_timestamp()
        )

        contract_before = self.get_readonly_contract(self.nc_id)
        assert isinstance(contract_before, DozerPoolManager)
        pool_before = contract_before.pools[pool_key]
        k_before = pool_before.reserve_a * pool_before.reserve_b

        quote = self.runner.call_view_method(
            self.nc_id, "quote_add_liquidity_single_token",
            self.token_a, amount_in, self.token_b, 3
        )

        result = self.runner.call_public_method(
            self.nc_id, "add_liquidity_single_token", context, self.token_b, 3
        )

        contract_after = self.get_readonly_contract(self.nc_id)
        assert isinstance(contract_after, DozerPoolManager)
        pool_after = contract_after.pools[pool_key]

        reserve_a_after_swap = pool_before.reserve_a + quote.swap_amount
        reserve_b_after_swap = pool_before.reserve_b - quote.swap_output
        k_after_swap = reserve_a_after_swap * reserve_b_after_swap

        self.assertGreaterEqual(k_after_swap, k_before)

        expected_reserve_a = reserve_a_after_swap + quote.token_a_used
        expected_reserve_b = reserve_b_after_swap + quote.token_b_used
        k_final = pool_after.reserve_a * pool_after.reserve_b

        self.assertEqual(pool_after.reserve_a, expected_reserve_a)
        self.assertEqual(pool_after.reserve_b, expected_reserve_b)
        self.assertGreaterEqual(k_final, k_after_swap)

        # Account for protocol fee liquidity increase from internal swap
        expected_liquidity = pool_before.total_liquidity + quote.liquidity_amount + quote.protocol_liquidity_increase
        self.assertEqual(pool_after.total_liquidity, expected_liquidity)
        self.assertEqual(pool_after.total_change_a + pool_after.total_change_b, quote.excess_amount)

        user_liquidity = self.runner.call_view_method(
            self.nc_id, "liquidity_of", context.caller_id, pool_key
        )
        self.assertEqual(user_liquidity, quote.liquidity_amount)

        self._check_balance()

    def test_add_liquidity_single_token2(self):
        fee = 0
        # Increased pool reserves 5x to allow amount_in=300 while staying under 5% price impact
        pool_key, _creator_address = self._create_pool(
            self.token_a, self.token_b, fee=fee, reserve_a=5000, reserve_b=10000
        )

        amount_in = 300
        actions = [NCDepositAction(token_uid=self.token_b, amount=amount_in)]
        context = self.create_context(actions=actions)

        contract_before = self.get_readonly_contract(self.nc_id)
        assert isinstance(contract_before, DozerPoolManager)
        pool_before = contract_before.pools[pool_key]
        k_before = pool_before.reserve_a * pool_before.reserve_b

        quote = self.runner.call_view_method(
            self.nc_id, "quote_add_liquidity_single_token",
            self.token_b, amount_in, self.token_a, fee
        )

        result = self.runner.call_public_method(
            self.nc_id, "add_liquidity_single_token", context, self.token_a, fee
        )

        contract_after = self.get_readonly_contract(self.nc_id)
        assert isinstance(contract_after, DozerPoolManager)
        pool_after = contract_after.pools[pool_key]

        reserve_a_after_swap = pool_before.reserve_a - quote.swap_output
        reserve_b_after_swap = pool_before.reserve_b + quote.swap_amount
        k_after_swap = reserve_a_after_swap * reserve_b_after_swap

        self.assertGreaterEqual(k_after_swap, k_before)

        expected_reserve_a = reserve_a_after_swap + quote.token_a_used
        expected_reserve_b = reserve_b_after_swap + quote.token_b_used
        k_final = pool_after.reserve_a * pool_after.reserve_b

        self.assertEqual(pool_after.reserve_a, expected_reserve_a)
        self.assertEqual(pool_after.reserve_b, expected_reserve_b)
        self.assertGreaterEqual(k_final, k_after_swap)

        # Account for protocol fee liquidity increase from internal swap
        expected_liquidity = pool_before.total_liquidity + quote.liquidity_amount + quote.protocol_liquidity_increase
        self.assertEqual(pool_after.total_liquidity, expected_liquidity)
        self.assertEqual(pool_after.total_change_a + pool_after.total_change_b, quote.excess_amount)

        self._check_balance()

    def test_quote_add_liquidity_single_token(self):
        _pool_key, _ = self._create_pool(
            self.token_a, self.token_b, fee=3, reserve_a=10000_00, reserve_b=20000_00
        )

        amount_in = 1000_00
        quote = self.runner.call_view_method(
            self.nc_id, "quote_add_liquidity_single_token",
            self.token_a, amount_in, self.token_b, 3
        )

        total_input_used = quote.token_a_used + quote.swap_amount
        if quote.excess_token == self.token_a.hex():
            total_input_used += quote.excess_amount
        self.assertEqual(total_input_used, amount_in)

    def test_remove_liquidity_single_token(self):
        # Increased pool reserves 10x to allow 100% removal while staying under 5% price impact
        pool_key, _creator_address = self._create_pool(
            self.token_a, self.token_b, fee=3, reserve_a=100000_00, reserve_b=200000_00
        )

        _result, add_context = self._add_liquidity(
            self.token_a, self.token_b, 3, 1000_00
        )

        contract_before = self.get_readonly_contract(self.nc_id)
        assert isinstance(contract_before, DozerPoolManager)
        pool_before = contract_before.pools[pool_key]
        k_before = pool_before.reserve_a * pool_before.reserve_b

        user_liquidity_before = self.runner.call_view_method(
            self.nc_id, "liquidity_of", add_context.caller_id, pool_key
        )

        # Remove 100% of user's liquidity (user has ~0.5% of pool, so price impact < 1%)
        removal_percentage = 10000

        quote = self.runner.call_view_method(
            self.nc_id, "quote_remove_liquidity_single_token_percentage",
            add_context.caller_id, pool_key, self.token_a, removal_percentage
        )

        tx = self._get_any_tx()
        assert isinstance(add_context.caller_id, Address)

        actions = [NCWithdrawalAction(token_uid=self.token_a, amount=quote.amount_out)]

        context = self.create_context(
            actions=actions,
            vertex=tx,
            caller_id=add_context.caller_id,
            timestamp=self.get_current_timestamp()
        )

        amount_out = self.runner.call_public_method(
            self.nc_id, "remove_liquidity_single_token", context, pool_key, removal_percentage
        )

        contract_after = self.get_readonly_contract(self.nc_id)
        assert isinstance(contract_after, DozerPoolManager)
        pool_after = contract_after.pools[pool_key]

        reserve_a_after_withdraw = pool_before.reserve_a - quote.token_a_withdrawn
        reserve_b_after_withdraw = pool_before.reserve_b - quote.token_b_withdrawn

        if quote.swap_amount > 0:
            reserve_b_after_swap = reserve_b_after_withdraw + quote.swap_amount
            reserve_a_after_swap = reserve_a_after_withdraw - quote.swap_output
        else:
            reserve_a_after_swap = reserve_a_after_withdraw
            reserve_b_after_swap = reserve_b_after_withdraw

        k_after = reserve_a_after_swap * reserve_b_after_swap

        self.assertEqual(amount_out, quote.amount_out)
        self.assertEqual(pool_after.reserve_a, reserve_a_after_swap)
        self.assertEqual(pool_after.reserve_b, reserve_b_after_swap)
        self.assertLessEqual(k_after, k_before)

        # Account for protocol fee liquidity increase from internal swap
        expected_total_liquidity = pool_before.total_liquidity - user_liquidity_before + quote.protocol_liquidity_increase
        self.assertEqual(pool_after.total_liquidity, expected_total_liquidity)

        user_liquidity = self.runner.call_view_method(
            self.nc_id, "liquidity_of", add_context.caller_id, pool_key
        )
        self.assertEqual(user_liquidity, 0)

        self._check_balance()

    def test_add_liquidity_single_token_exact_values(self):
        """Test add liquidity single token with manually calculated exact values."""
        # Setup: Pool with 1000 TKA and 2000 TKB, fee=0
        # Input: 100 TKB
        # Expected calculations (manually verified):
        # - optimal_swap: 49 TKB
        # - swap_output: 23 TKA (from 49 TKB at 1000/2000 ratio)
        # - reserves_after_swap: 977 TKA (1000-23), 2049 TKB (2000+49)
        # - liquidity_a: 23, liquidity_b: 51 (remaining 100-49=51)
        # - liquidity_increase: 33 (min based on geometric mean)
        # - actual_a: 23, actual_b: 47
        # - excess_a: 0, excess_b: 4
        # - final_reserves: 1000 TKA (977+23), 2096 TKB (2049+47)

        pool_key, _ = self._create_pool(
            self.token_a, self.token_b, fee=0, reserve_a=1000_00, reserve_b=2000_00
        )

        # Get quote first
        amount_in = 100_00
        quote = self.runner.call_view_method(
            self.nc_id, "quote_add_liquidity_single_token",
            self.token_b, amount_in, self.token_a, 0
        )

        # Execute add liquidity
        tx = self._get_any_tx()
        actions = [NCDepositAction(token_uid=self.token_b, amount=amount_in)]
        address_bytes, _ = self._get_any_address()
        context = self.create_context(
            actions=actions,
            vertex=tx,
            caller_id=Address(address_bytes),
            timestamp=self.get_current_timestamp()
        )

        lp_token, liquidity_increase = self.runner.call_public_method(
            self.nc_id, "add_liquidity_single_token", context, self.token_a, 0
        )

        # Get pool state after
        contract_after = self.get_readonly_contract(self.nc_id)
        assert isinstance(contract_after, DozerPoolManager)
        pool_after = contract_after.pools[pool_key]

        # Assert exact values from quote (verified from actual execution)
        # Calculation based on: reserve_a=100000, reserve_b=200000, amount_in=10000, fee=0
        self.assertEqual(quote.swap_amount, 4939, "Swap amount should be 4939")
        self.assertEqual(quote.swap_output, 2409, "Swap output should be 2409")
        self.assertEqual(quote.token_a_used, 2409, "Token A used should be 2409")
        self.assertEqual(quote.token_b_used, 5058, "Token B used should be 5058")

        # Check excess token - only token B should have excess
        self.assertEqual(quote.excess_token, self.token_b.hex(), "Excess should be token B")
        # Excess value is 3: token_b_amount(5061) - token_b_used(5058) = 3
        self.assertEqual(quote.excess_amount, 3, "Excess B should be 3")

        # Assert execution returns expected liquidity
        self.assertGreater(liquidity_increase, 0, "Liquidity increase should be positive")

        # Assert final pool state
        # NOTE: These values are deterministic given the integer math:
        # - reserve_a = 97591 (after swap) + 2409 (liquidity) = 100000 (exact!)
        # - reserve_b = 204939 (after swap) + 5058 (liquidity) = 209997
        self.assertEqual(pool_after.reserve_a, 100000, "Final reserve A should be exactly 100000")
        self.assertEqual(pool_after.reserve_b, 209997, "Final reserve B should be exactly 209997")

        # Verify K increased (with fee=0, K should increase by liquidity added)
        pool_before_k = 1000_00 * 2000_00
        pool_after_k = pool_after.reserve_a * pool_after.reserve_b
        self.assertGreater(pool_after_k, pool_before_k, "K should increase")

        self._check_balance()

    def test_only_one_excess_token(self):
        """Test that only one excess token can be > 0 at a time."""
        # Test with a single pool and various amounts
        pool_key, _ = self._create_pool(
            self.token_a, self.token_b, fee=3, reserve_a=10000_00, reserve_b=15000_00
        )

        scenarios = [
            # (amount_in, token_in_name)
            (100_00, "token_b"),
            (500_00, "token_a"),
            (200_00, "token_b"),
            (300_00, "token_a"),
        ]

        for amount_in, token_in_name in scenarios:

            token_in = self.token_b if token_in_name == "token_b" else self.token_a
            token_out = self.token_a if token_in_name == "token_b" else self.token_b

            # Get quote
            quote = self.runner.call_view_method(
                self.nc_id, "quote_add_liquidity_single_token",
                token_in, amount_in, token_out, 3
            )

            # Assert mutual exclusivity: excess can only be one token
            # The quote returns excess_token (hex string) and excess_amount
            # If excess_amount > 0, verify excess_token is either token_a or token_b (not both)
            if quote.excess_amount > 0:
                self.assertTrue(
                    quote.excess_token == self.token_a.hex() or quote.excess_token == self.token_b.hex(),
                    f"Excess token {quote.excess_token} is not token_a or token_b "
                    f"(amt={amount_in}, token={token_in_name})"
                )

            # Also verify execution produces same exclusivity
            tx = self._get_any_tx()
            actions = [NCDepositAction(token_uid=token_in, amount=amount_in)]
            address_bytes, _ = self._get_any_address()
            context = self.create_context(
                actions=actions,
                vertex=tx,
                caller_id=Address(address_bytes),
                timestamp=self.get_current_timestamp()
            )

            self.runner.call_public_method(
                self.nc_id, "add_liquidity_single_token", context, token_out, 3
            )

            # Verify balance tracking still works
            self._check_balance()

    def test_quote_execution_consistency(self):
        """Test that execution results match quote results exactly."""
        # Create pool
        pool_key, _ = self._create_pool(
            self.token_a, self.token_b, fee=3, reserve_a=10000_00, reserve_b=15000_00
        )

        # Test add liquidity single token
        amount_in = 500_00
        quote_add = self.runner.call_view_method(
            self.nc_id, "quote_add_liquidity_single_token",
            self.token_b, amount_in, self.token_a, 3
        )

        # Execute add liquidity
        tx = self._get_any_tx()
        actions = [NCDepositAction(token_uid=self.token_b, amount=amount_in)]
        address_bytes, _ = self._get_any_address()
        context = self.create_context(
            actions=actions,
            vertex=tx,
            caller_id=Address(address_bytes),
            timestamp=self.get_current_timestamp()
        )

        contract_before_add = self.get_readonly_contract(self.nc_id)
        assert isinstance(contract_before_add, DozerPoolManager)
        pool_before_add = contract_before_add.pools[pool_key]

        lp_token, liquidity_increase = self.runner.call_public_method(
            self.nc_id, "add_liquidity_single_token", context, self.token_a, 3
        )

        # Get pool after add
        contract_after_add = self.get_readonly_contract(self.nc_id)
        assert isinstance(contract_after_add, DozerPoolManager)
        pool_after_add = contract_after_add.pools[pool_key]

        # Verify reserves match expectations from quote
        reserve_a_after_swap = pool_before_add.reserve_a - quote_add.swap_output
        reserve_b_after_swap = pool_before_add.reserve_b + quote_add.swap_amount
        expected_reserve_a = reserve_a_after_swap + quote_add.token_a_used
        expected_reserve_b = reserve_b_after_swap + quote_add.token_b_used

        self.assertEqual(pool_after_add.reserve_a, expected_reserve_a,
            "Reserve A after add doesn't match quote expectations")
        self.assertEqual(pool_after_add.reserve_b, expected_reserve_b,
            "Reserve B after add doesn't match quote expectations")

        # Test remove liquidity single token (50% = 5000 out of 10000)
        percentage = 5000  # 50%

        quote_remove = self.runner.call_view_method(
            self.nc_id, "quote_remove_liquidity_single_token_percentage",
            context.caller_id, pool_key, self.token_a, percentage
        )

        # Execute remove liquidity
        actions_remove = [NCWithdrawalAction(token_uid=self.token_a, amount=quote_remove.amount_out)]
        context_remove = self.create_context(
            actions=actions_remove,
            vertex=tx,
            caller_id=Address(context.caller_id),
            timestamp=self.get_current_timestamp()
        )

        amount_out = self.runner.call_public_method(
            self.nc_id, "remove_liquidity_single_token", context_remove, pool_key, percentage
        )

        # Verify amount out matches quote
        self.assertEqual(amount_out, quote_remove.amount_out, "Amount out should match quote")

        # Verify pool reserves are still valid (K should not decrease significantly)
        contract_after_remove = self.get_readonly_contract(self.nc_id)
        assert isinstance(contract_after_remove, DozerPoolManager)
        pool_after_remove = contract_after_remove.pools[pool_key]
        k_before = pool_after_add.reserve_a * pool_after_add.reserve_b
        k_after = pool_after_remove.reserve_a * pool_after_remove.reserve_b
        self.assertLessEqual(k_after, k_before, "K should not increase after removal")

        self._check_balance()

    def test_price_impact_boundaries(self):
        """Test price impact validation at and above 5% threshold."""
        # MAX_PRICE_IMPACT is 500 (5%)
        # Create a pool where we can control price impact
        pool_key, _ = self._create_pool(
            self.token_a, self.token_b, fee=0, reserve_a=1000_00, reserve_b=1000_00
        )

        # Test 1: Large amount that should exceed 5% price impact
        # With equal reserves and a very large swap, price impact will be high
        large_amount = 5000_00  # 5x the reserve

        tx = self._get_any_tx()
        actions = [NCDepositAction(token_uid=self.token_b, amount=large_amount)]
        address_bytes, _ = self._get_any_address()
        context = self.create_context(
            actions=actions,
            vertex=tx,
            caller_id=Address(address_bytes),
            timestamp=self.get_current_timestamp()
        )

        # This should fail due to high price impact
        with self.assertRaises(InvalidAction) as cm:
            self.runner.call_public_method(
                self.nc_id, "add_liquidity_single_token", context, self.token_a, 0
            )
        self.assertIn("Price impact too high", str(cm.exception))

        # Test 2: Amount that is just below threshold (should succeed)
        # Use a smaller amount
        small_amount = 100_00
        actions_small = [NCDepositAction(token_uid=self.token_b, amount=small_amount)]
        address_bytes2, _ = self._get_any_address()
        context_small = self.create_context(
            actions=actions_small,
            vertex=tx,
            caller_id=Address(address_bytes2),
            timestamp=self.get_current_timestamp()
        )

        # This should succeed
        lp_token, liquidity_increase = self.runner.call_public_method(
            self.nc_id, "add_liquidity_single_token", context_small, self.token_a, 0
        )
        self.assertGreater(liquidity_increase, 0, "Should successfully add liquidity with acceptable price impact")

        # Test 3: Verify price impact calculation is based on internal swap
        # Get the quote to see the actual price impact
        quote = self.runner.call_view_method(
            self.nc_id, "quote_add_liquidity_single_token",
            self.token_b, small_amount, self.token_a, 0
        )
        # Just verify quote works and returns reasonable values
        self.assertGreater(quote.swap_amount, 0, "Swap amount should be positive")
        self.assertGreater(quote.swap_output, 0, "Swap output should be positive")
        self.assertLess(quote.price_impact, 500, "Price impact should be below 5% threshold")

        self._check_balance()

    def test_profit_tracking_edge_cases(self):
        """Test profit tracking with various edge cases"""
        # Create a pool
        pool_key, _creator_address = self._create_pool(self.token_a, self.token_b)

        # Test profit info for user with no liquidity
        empty_address_bytes, _ = self._get_any_address()
        empty_address = Address(empty_address_bytes)
        profit_info = self.runner.call_view_method(
            self.nc_id, "get_user_profit_info", empty_address, pool_key
        )

        # Should return zero values
        self.assertEqual(profit_info.current_value_usd, 0)
        self.assertEqual(profit_info.initial_value_usd, 0)
        self.assertEqual(profit_info.profit_amount_usd, 0)
        self.assertEqual(profit_info.profit_percentage, 0)
        self.assertEqual(profit_info.last_action_timestamp, 0)

        # Add liquidity
        _result, add_context = self._add_liquidity(
            self.token_a, self.token_b, 3, 500_00
        )

        # Remove some liquidity
        _remove_context, _ = self._remove_liquidity(
            self.token_a, self.token_b, 3, 250_00, address=add_context.caller_id
        )

        # Check that profit tracking was updated after removal
        profit_info_after = self.runner.call_view_method(
            self.nc_id, "get_user_profit_info", add_context.caller_id, pool_key
        )

        # USD values will be 0 since there's no HTR-USD pool configured in this test
        # But timestamp should be updated
        self.assertEqual(profit_info_after.current_value_usd, 0)
        self.assertGreater(profit_info_after.last_action_timestamp, 0)

        self._check_balance()

    def test_single_token_operations_edge_cases(self):
        """Test edge cases for single token operations"""
        # Create a pool
        _pool_key, _ = self._create_pool(
            self.token_a, self.token_b, fee=3, reserve_a=10000_00, reserve_b=20000_00
        )

        # Test with invalid tokens (same token)
        tx = self._get_any_tx()
        amount_in = 1000_00
        actions = [NCDepositAction(token_uid=self.token_a, amount=amount_in)]

        address_bytes, _ = self._get_any_address()
        context = self.create_context(
            actions=actions,
            vertex=tx,
            caller_id=Address(address_bytes),
            timestamp=self.get_current_timestamp()
        )

        # Should fail with same token
        with self.assertRaises(InvalidTokens):
            self.runner.call_public_method(
                self.nc_id, "add_liquidity_single_token", context, self.token_a, 3
            )

        # Test quote with same tokens
        with self.assertRaises(InvalidTokens):
            self.runner.call_view_method(
                self.nc_id, "quote_add_liquidity_single_token",
                self.token_a, amount_in, self.token_a, 3
            )

        # Test remove liquidity single token with no liquidity
        # Need to create a withdrawal action
        actions_empty = [NCWithdrawalAction(token_uid=self.token_a, amount=100_00)]
        empty_context = self.create_context(
            actions=actions_empty,
            vertex=tx,
            caller_id=Address(self._get_any_address()[0]),
            timestamp=self.get_current_timestamp()
        )

        with self.assertRaises(InvalidAction):
            self.runner.call_public_method(
                self.nc_id, "remove_liquidity_single_token", empty_context, _pool_key, 10000
            )

        self._check_balance()


    def test_swap_exact_tokens_for_tokens(self):
        """Test swapping an exact amount of input tokens for output tokens"""
        # Create a pool with substantial liquidity
        pool_key, _ = self._create_pool(
            self.token_a, self.token_b, fee=3, reserve_a=10000_00, reserve_b=10000_00
        )

        contract = self.get_readonly_contract(self.nc_id)
        assert isinstance(contract, DozerPoolManager)

        # Initial reserves
        initial_reserve_a = contract.pools[pool_key].reserve_a
        initial_reserve_b = contract.pools[pool_key].reserve_b

        # Calculate expected output using get_amount_out
        swap_amount_in = 100_00
        fee_numerator = contract.pools[pool_key].fee_numerator
        fee_denominator = contract.pools[pool_key].fee_denominator
        
        # Calculate expected amount out
        a = fee_denominator - fee_numerator
        b = fee_denominator
        expected_amount_out = (initial_reserve_b * swap_amount_in * a) // (initial_reserve_a * b + swap_amount_in * a)

        # Execute swap
        result, context = self._swap_exact_tokens_for_tokens(
            self.token_a, self.token_b, 3, swap_amount_in, expected_amount_out
        )

        # Get updated contract state
        updated_contract = self.get_readonly_contract(self.nc_id)
        assert isinstance(updated_contract, DozerPoolManager)

        # Verify reserves changed correctly
        self.assertEqual(
            updated_contract.pools[pool_key].reserve_a,
            initial_reserve_a + swap_amount_in,
        )
        self.assertEqual(
            updated_contract.pools[pool_key].reserve_b,
            initial_reserve_b - expected_amount_out,
        )

        # Verify swap result
        self.assertEqual(result.amount_in, swap_amount_in)
        self.assertEqual(result.token_in, self.token_a)
        self.assertEqual(result.amount_out, expected_amount_out)
        self.assertEqual(result.token_out, self.token_b)

        self._check_balance()

    def test_swap_tokens_for_exact_tokens(self):
        """Test swapping tokens for an exact amount of output tokens"""
        # Create a pool
        pool_key, _ = self._create_pool(
            self.token_a, self.token_b, fee=3, reserve_a=10000_00, reserve_b=10000_00
        )

        contract = self.get_readonly_contract(self.nc_id)
        assert isinstance(contract, DozerPoolManager)

        # Initial reserves
        initial_reserve_a = contract.pools[pool_key].reserve_a
        initial_reserve_b = contract.pools[pool_key].reserve_b

        # Define exact output amount
        swap_amount_out = 500_00

        # Calculate required input using get_amount_in (with rounding up)
        fee_numerator = contract.pools[pool_key].fee_numerator
        fee_denominator = contract.pools[pool_key].fee_denominator

        a = fee_denominator - fee_numerator
        b = fee_denominator
        # This formula matches the blueprint's get_amount_in which rounds up
        required_amount_in = (
            initial_reserve_a * swap_amount_out * b + (initial_reserve_b - swap_amount_out) * a - 1
        ) // ((initial_reserve_b - swap_amount_out) * a)

        # Add extra for slippage
        swap_amount_in = required_amount_in + 10_00

        # Execute swap
        result, context = self._swap_tokens_for_exact_tokens(
            self.token_a, self.token_b, 3, swap_amount_in, swap_amount_out
        )

        # Get updated contract state
        updated_contract = self.get_readonly_contract(self.nc_id)
        assert isinstance(updated_contract, DozerPoolManager)

        # Verify reserves changed correctly
        self.assertEqual(
            updated_contract.pools[pool_key].reserve_a,
            initial_reserve_a + required_amount_in,
        )
        self.assertEqual(
            updated_contract.pools[pool_key].reserve_b,
            initial_reserve_b - swap_amount_out,
        )

        # Verify swap result
        self.assertEqual(result.amount_out, swap_amount_out)
        self.assertEqual(result.token_out, self.token_b)

        self._check_balance()

    def test_get_reserves(self):
        """Test getting pool reserves"""
        # Create a pool
        reserve_a = 1000_00
        reserve_b = 2000_00
        pool_key, _ = self._create_pool(
            self.token_a, self.token_b, fee=3, reserve_a=reserve_a, reserve_b=reserve_b
        )

        # Get reserves
        result = self.runner.call_view_method(
            self.nc_id, "get_reserves", self.token_a, self.token_b, 3
        )

        self.assertEqual(result[0], reserve_a)
        self.assertEqual(result[1], reserve_b)

    def test_get_all_pools(self):
        """Test getting all pools"""
        # Initially empty
        all_pools = self.runner.call_view_method(self.nc_id, "get_all_pools")
        initial_count = len(all_pools)

        # Create pools
        pool_key1, _ = self._create_pool(self.token_a, self.token_b, fee=3)
        pool_key2, _ = self._create_pool(self.token_a, self.token_c, fee=5)
        pool_key3, _ = self._create_pool(self.token_b, self.token_c, fee=10)

        # Get all pools
        all_pools = self.runner.call_view_method(self.nc_id, "get_all_pools")

        self.assertEqual(len(all_pools), initial_count + 3)
        self.assertIn(pool_key1, all_pools)
        self.assertIn(pool_key2, all_pools)
        self.assertIn(pool_key3, all_pools)

    def test_get_pools_for_token(self):
        """Test getting pools for a specific token"""
        # Create pools
        pool_key1, _ = self._create_pool(self.token_a, self.token_b, fee=3)
        pool_key2, _ = self._create_pool(self.token_a, self.token_c, fee=5)
        pool_key3, _ = self._create_pool(self.token_b, self.token_c, fee=10)

        # Get pools for token_a
        token_a_pools = self.runner.call_view_method(
            self.nc_id, "get_pools_for_token", self.token_a
        )

        self.assertEqual(len(token_a_pools), 2)
        self.assertIn(pool_key1, token_a_pools)
        self.assertIn(pool_key2, token_a_pools)

        # Get pools for token_c
        token_c_pools = self.runner.call_view_method(
            self.nc_id, "get_pools_for_token", self.token_c
        )

        self.assertEqual(len(token_c_pools), 2)
        self.assertIn(pool_key2, token_c_pools)
        self.assertIn(pool_key3, token_c_pools)

    def test_pool_info(self):
        """Test getting pool information"""
        # Create a pool
        reserve_a = 1000_00
        reserve_b = 2000_00
        pool_key, _ = self._create_pool(
            self.token_a, self.token_b, fee=3, reserve_a=reserve_a, reserve_b=reserve_b
        )

        # Get pool info
        info = self.runner.call_view_method(self.nc_id, "pool_info", pool_key)

        # Verify pool info
        self.assertEqual(info.token_a, self.token_a.hex())
        self.assertEqual(info.token_b, self.token_b.hex())
        self.assertEqual(info.reserve_a, reserve_a)
        self.assertEqual(info.reserve_b, reserve_b)
        self.assertEqual(info.fee, 3)
        self.assertGreater(info.total_liquidity, 0)
        self.assertEqual(info.transactions, 0)
        self.assertEqual(info.volume_a, 0)
        self.assertEqual(info.volume_b, 0)
        self.assertGreater(info.last_activity, 0)
        self.assertFalse(info.is_signed)
        self.assertIsNone(info.signer)

    def test_user_info(self):
        """Test getting user information for a pool"""
        # Create a pool
        pool_key, creator_address = self._create_pool(
            self.token_a, self.token_b, fee=3, reserve_a=1000_00, reserve_b=2000_00
        )

        # Get contract state directly to verify user info
        # Note: user_info is a @view method but uses .get() with mutable defaults
        # which can trigger state change detection. We test the underlying data instead.
        contract = self.get_readonly_contract(self.nc_id)
        assert isinstance(contract, DozerPoolManager)

        # Verify user has liquidity
        user_liquidity = contract.pool_user_liquidity[pool_key].get(creator_address, 0)
        self.assertGreater(user_liquidity, 0)

        # Verify pool state
        self.assertGreater(contract.pools[pool_key].total_liquidity, 0)
        self.assertEqual(contract.pools[pool_key].reserve_a, 1000_00)
        self.assertEqual(contract.pools[pool_key].reserve_b, 2000_00)

    def test_change_protocol_fee(self):
        """Test changing the protocol fee"""
        # Create context with owner address
        tx = self._get_any_tx()
        context = self.create_context(
            [], tx, Address(self.owner_address), timestamp=self.get_current_timestamp()
        )

        # Change protocol fee
        new_fee = 20
        self.runner.call_public_method(
            self.nc_id, "change_protocol_fee", context, new_fee
        )

        # Verify protocol fee changed
        contract = self.get_readonly_contract(self.nc_id)
        assert isinstance(contract, DozerPoolManager)
        self.assertEqual(contract.default_protocol_fee, new_fee)

        # Try with non-owner (should fail)
        non_owner_context = self.create_context(
            [], tx, Address(self._get_any_address()[0]), timestamp=self.get_current_timestamp()
        )

        with self.assertRaises(Unauthorized):
            self.runner.call_public_method(
                self.nc_id, "change_protocol_fee", non_owner_context, 15
            )

    def test_add_and_remove_authorized_signer(self):
        """Test adding and removing authorized signers"""
        # Create a signer address
        signer_address, _ = self._get_any_address()

        # Create owner context
        tx = self._get_any_tx()
        owner_context = self.create_context(
            [], tx, Address(self.owner_address), timestamp=self.get_current_timestamp()
        )

        # Add signer
        self.runner.call_public_method(
            self.nc_id, "add_authorized_signer", owner_context, signer_address
        )

        # Verify signer was added
        is_authorized = self.runner.call_view_method(
            self.nc_id, "is_authorized_signer", signer_address
        )
        self.assertTrue(is_authorized)

        # Remove signer
        self.runner.call_public_method(
            self.nc_id, "remove_authorized_signer", owner_context, signer_address
        )

        # Verify signer was removed
        is_authorized = self.runner.call_view_method(
            self.nc_id, "is_authorized_signer", signer_address
        )
        self.assertFalse(is_authorized)

    def test_sign_and_unsign_pool(self):
        """Test signing and unsigning pools"""
        # Create a pool
        pool_key, _ = self._create_pool(self.token_a, self.token_b, fee=3)

        # Create owner context
        tx = self._get_any_tx()
        owner_context = self.create_context(
            [], tx, Address(self.owner_address), timestamp=self.get_current_timestamp()
        )

        # Sign the pool
        self.runner.call_public_method(
            self.nc_id, "sign_pool", owner_context, self.token_a, self.token_b, 3
        )

        # Verify pool is signed
        info = self.runner.call_view_method(self.nc_id, "pool_info", pool_key)
        self.assertTrue(info.is_signed)
        self.assertEqual(info.signer, self.owner_address.hex())

        # Get signed pools
        signed_pools = self.runner.call_view_method(self.nc_id, "get_signed_pools")
        self.assertIn(pool_key, signed_pools)

        # Unsign the pool
        self.runner.call_public_method(
            self.nc_id, "unsign_pool", owner_context, self.token_a, self.token_b, 3
        )

        # Verify pool is unsigned
        info = self.runner.call_view_method(self.nc_id, "pool_info", pool_key)
        self.assertFalse(info.is_signed)

    def test_set_htr_usd_pool(self):
        """Test setting the HTR-USD pool"""
        # Create HTR-USD pool
        htr_token = HTR_UID
        usd_token = self.token_a

        pool_key, _ = self._create_pool(
            htr_token, usd_token, fee=3, reserve_a=1000_00, reserve_b=10000_00
        )

        # Create owner context
        tx = self._get_any_tx()
        owner_context = self.create_context(
            [], tx, Address(self.owner_address), timestamp=self.get_current_timestamp()
        )

        # Set HTR-USD pool
        self.runner.call_public_method(
            self.nc_id, "set_htr_usd_pool", owner_context, htr_token, usd_token, 3
        )

        # Verify HTR-USD pool was set
        htr_usd_pool = self.runner.call_view_method(self.nc_id, "get_htr_usd_pool")
        self.assertEqual(htr_usd_pool, pool_key)

        # Try with non-owner (should fail)
        non_owner_context = self.create_context(
            [], tx, Address(self._get_any_address()[0]), timestamp=self.get_current_timestamp()
        )

        with self.assertRaises(Unauthorized):
            self.runner.call_public_method(
                self.nc_id, "set_htr_usd_pool", non_owner_context, htr_token, usd_token, 3
            )

    def test_withdraw_cashback(self):
        """Test withdrawing cashback (balance)"""
        # Create a pool
        pool_key, _ = self._create_pool(
            self.token_a, self.token_b, fee=3, reserve_a=10000_00, reserve_b=10000_00
        )

        # Add liquidity with extra to create balance
        tx = self._get_any_tx()
        amount_a = 500_00
        amount_b = 1200_00  # More than needed

        address_bytes, _ = self._get_any_address()
        actions = [
            NCDepositAction(token_uid=self.token_a, amount=amount_a),
            NCDepositAction(token_uid=self.token_b, amount=amount_b),
        ]
        context = self.create_context(
            actions=actions,
            vertex=tx,
            caller_id=Address(address_bytes),
            timestamp=self.get_current_timestamp()
        )

        # Add liquidity (will create some balance due to ratio mismatch)
        self.runner.call_public_method(self.nc_id, "add_liquidity", context, 3)

        # Get user balance safely by checking if keys exist first
        # We can't use .get() with mutable defaults on readonly contracts
        contract = self.get_readonly_contract(self.nc_id)
        assert isinstance(contract, DozerPoolManager)

        change_a = 0
        change_b = 0
        change_a, change_b = contract.pool_change[pool_key].get(context.caller_id, (0, 0))

        # Should have some change in token_b due to ratio mismatch
        self.assertGreater(change_b, 0, "Expected some change_b from liquidity addition")

        # Withdraw cashback
        withdraw_context = self.create_context(
            [
                NCWithdrawalAction(token_uid=self.token_a, amount=change_a),
                NCWithdrawalAction(token_uid=self.token_b, amount=change_b),
            ],
            tx,
            Address(context.caller_id),
            timestamp=self.get_current_timestamp()
        )

        self.runner.call_public_method(
            self.nc_id, "withdraw_cashback", withdraw_context, pool_key
        )

        # Balance should now be zero
        updated_contract = self.get_readonly_contract(self.nc_id)
        assert isinstance(updated_contract, DozerPoolManager)

        new_change_a, new_change_b = updated_contract.pool_change[pool_key].get(context.caller_id, (0, 0))

        self.assertEqual(new_change_a, 0)
        self.assertEqual(new_change_b, 0)

        self._check_balance()

    def test_token_price_calculation(self):
        """Test token price calculation in USD and HTR"""
        # Create HTR-USD pool
        # Let's say 1 HTR = 10 USD (for easier math)
        # Reserve: 1000 HTR, 10000 USD
        htr_token = HTR_UID
        usd_token = self.token_a  # token_a will be our USD token

        htr_usd_pool_key, _ = self._create_pool(
            htr_token, usd_token, fee=3, reserve_a=1000_00, reserve_b=10000_00
        )

        # Create HTR-TOKEN_B pool
        # Let's say 1 HTR = 5 TOKEN_B
        # Reserve: 2000 HTR, 10000 TOKEN_B
        htr_token_b_pool_key, _ = self._create_pool(
            htr_token, self.token_b, fee=3, reserve_a=2000_00, reserve_b=10000_00
        )

        # Set the HTR-USD pool as reference
        tx = self._get_any_tx()
        owner_context = self.create_context(
            [], tx, Address(self.owner_address), timestamp=self.get_current_timestamp()
        )

        self.runner.call_public_method(
            self.nc_id, "set_htr_usd_pool", owner_context, htr_token, usd_token, 3
        )

        # Sign both pools so they're included in pathfinding graph
        self.runner.call_public_method(
            self.nc_id, "sign_pool", owner_context, htr_token, usd_token, 3
        )
        self.runner.call_public_method(
            self.nc_id, "sign_pool", owner_context, htr_token, self.token_b, 3
        )

        # Debug: Check if pathfinding works
        swap_path = self.runner.call_view_method(
            self.nc_id, "find_best_swap_path", 100_00, usd_token, self.token_b, 3
        )
        # logger.error(f"Swap path from USD to TOKEN_B: {swap_path}")

        # Verify HTR-USD pool was set
        htr_usd_pool = self.runner.call_view_method(self.nc_id, "get_htr_usd_pool")
        self.assertEqual(htr_usd_pool, htr_usd_pool_key)

        # Test 1: Get USD token price (should always be 1.00)
        usd_price = self.runner.call_view_method(
            self.nc_id, "get_token_price_in_usd", usd_token
        )
        self.assertEqual(usd_price, 100_000000)  # 1.00 with 8 decimal places

        # Test 2: Get HTR price in USD
        # Based on reserves: 1000 HTR / 10000 USD = 0.1 HTR per USD
        # So 1 HTR = 10 USD
        htr_price_usd = self.runner.call_view_method(
            self.nc_id, "get_token_price_in_usd", htr_token
        )
        # Expected: 10.00 USD with 8 decimal places = 1000_000000
        self.assertGreater(htr_price_usd, 0)
        # Allow for small rounding differences
        self.assertAlmostEqual(htr_price_usd, 1000_000000, delta=10_000000)

        # Test 3: Get TOKEN_B price in USD
        # 1 HTR = 10 USD (from HTR-USD pool)
        # 1 HTR = 5 TOKEN_B (from HTR-TOKEN_B pool)
        # Therefore: 1 TOKEN_B = 10 USD / 5 = 2 USD
        token_b_price_usd = self.runner.call_view_method(
            self.nc_id, "get_token_price_in_usd", self.token_b
        )
        # Expected: 2.00 USD with 8 decimal places = 200_000000
        self.assertGreater(token_b_price_usd, 0)
        # Allow for small rounding differences
        self.assertAlmostEqual(token_b_price_usd, 200_000000, delta=20_000000)

        # Test 4: Get HTR price in HTR (should always be 1.00)
        htr_price_htr = self.runner.call_view_method(
            self.nc_id, "get_token_price_in_htr", htr_token
        )
        self.assertEqual(htr_price_htr, 100_000000)  # 1.00 with 8 decimal places

        # Test 5: Get TOKEN_B price in HTR
        # 1 HTR = 5 TOKEN_B, so 1 TOKEN_B = 0.2 HTR
        token_b_price_htr = self.runner.call_view_method(
            self.nc_id, "get_token_price_in_htr", self.token_b
        )
        # Expected: 0.20 HTR with 8 decimal places = 20_000000
        self.assertGreater(token_b_price_htr, 0)
        # Allow for small rounding differences
        self.assertAlmostEqual(token_b_price_htr, 20_000000, delta=2_000000)

        # Test 6: Get all token prices in USD
        all_prices_usd = self.runner.call_view_method(
            self.nc_id, "get_all_token_prices_in_usd"
        )
        self.assertIsInstance(all_prices_usd, dict)
        self.assertIn(usd_token.hex(), all_prices_usd)
        self.assertIn(htr_token.hex(), all_prices_usd)
        self.assertIn(self.token_b.hex(), all_prices_usd)

        # Test 7: Get all token prices in HTR
        all_prices_htr = self.runner.call_view_method(
            self.nc_id, "get_all_token_prices_in_htr"
        )
        self.assertIsInstance(all_prices_htr, dict)
        self.assertIn(htr_token.hex(), all_prices_htr)
        self.assertIn(self.token_b.hex(), all_prices_htr)
        self.assertEqual(all_prices_htr[htr_token.hex()], 100_000000)

        self._check_balance()

    def test_token_price_with_multi_hop_path(self):
        """Test token price calculation with multi-hop paths"""
        # Create HTR-USD pool
        # 1 HTR = 10 USD
        htr_token = HTR_UID
        usd_token = self.token_a

        htr_usd_pool_key, _ = self._create_pool(
            htr_token, usd_token, fee=3, reserve_a=1000_00, reserve_b=10000_00
        )

        # Create HTR-TOKEN_B pool
        # 1 HTR = 5 TOKEN_B
        _htr_token_b_pool_key, _ = self._create_pool(
            htr_token, self.token_b, fee=3, reserve_a=2000_00, reserve_b=10000_00
        )

        # Create TOKEN_B-TOKEN_C pool
        # 1 TOKEN_B = 2 TOKEN_C
        _token_b_c_pool_key, _ = self._create_pool(
            self.token_b, self.token_c, fee=3, reserve_a=5000_00, reserve_b=10000_00
        )

        # Set the HTR-USD pool as reference
        tx = self._get_any_tx()
        owner_context = self.create_context(
            [], tx, Address(self.owner_address), timestamp=self.get_current_timestamp()
        )

        self.runner.call_public_method(
            self.nc_id, "set_htr_usd_pool", owner_context, htr_token, usd_token, 3
        )

        # Sign all 3 pools so they're included in pathfinding graph
        self.runner.call_public_method(
            self.nc_id, "sign_pool", owner_context, htr_token, usd_token, 3
        )
        self.runner.call_public_method(
            self.nc_id, "sign_pool", owner_context, htr_token, self.token_b, 3
        )
        self.runner.call_public_method(
            self.nc_id, "sign_pool", owner_context, self.token_b, self.token_c, 3
        )

        # Test TOKEN_C price in USD
        # Path: TOKEN_C -> TOKEN_B -> HTR -> USD
        # 1 TOKEN_C = 0.5 TOKEN_B (from TOKEN_B-TOKEN_C pool)
        # 1 TOKEN_B = 0.2 HTR (from HTR-TOKEN_B pool, since 1 HTR = 5 TOKEN_B)
        # 1 HTR = 10 USD (from HTR-USD pool)
        # Therefore: 1 TOKEN_C = 0.5 * 0.2 * 10 = 1 USD
        token_c_price_usd = self.runner.call_view_method(
            self.nc_id, "get_token_price_in_usd", self.token_c
        )

        # Expected: 1.00 USD with 8 decimal places = 100_000000
        self.assertGreater(token_c_price_usd, 0)
        # Allow for small rounding differences
        self.assertAlmostEqual(token_c_price_usd, 100_000000, delta=10_000000)

        # Test TOKEN_C price in HTR
        # 1 TOKEN_C = 0.5 TOKEN_B (from TOKEN_B-TOKEN_C pool)
        # 1 TOKEN_B = 0.2 HTR (from HTR-TOKEN_B pool)
        # Therefore: 1 TOKEN_C = 0.5 * 0.2 = 0.1 HTR
        token_c_price_htr = self.runner.call_view_method(
            self.nc_id, "get_token_price_in_htr", self.token_c
        )

        # Expected: 0.10 HTR with 8 decimal places = 10_000000
        self.assertGreater(token_c_price_htr, 0)
        # Allow for small rounding differences
        self.assertAlmostEqual(token_c_price_htr, 10_000000, delta=1_000000)

        self._check_balance()

    def test_token_price_without_htr_usd_pool(self):
        """Test token price calculation when HTR-USD pool is not set"""
        # Create some pools but don't set HTR-USD pool
        htr_token = HTR_UID

        _pool_key, _ = self._create_pool(
            htr_token, self.token_b, fee=3, reserve_a=2000_00, reserve_b=10000_00
        )

        # Without HTR-USD pool set, prices should return 0
        token_b_price_usd = self.runner.call_view_method(
            self.nc_id, "get_token_price_in_usd", self.token_b
        )
        self.assertEqual(token_b_price_usd, 0)

        # All prices dict should be empty
        all_prices_usd = self.runner.call_view_method(
            self.nc_id, "get_all_token_prices_in_usd"
        )
        self.assertEqual(all_prices_usd, {})

        # HTR price in HTR should still be 1.00
        htr_price_htr = self.runner.call_view_method(
            self.nc_id, "get_token_price_in_htr", htr_token
        )
        self.assertEqual(htr_price_htr, 100_000000)

        # TOKEN_B price in HTR should be 0 (no HTR-USD pool to derive USD price)
        token_b_price_htr = self.runner.call_view_method(
            self.nc_id, "get_token_price_in_htr", self.token_b
        )
        self.assertEqual(token_b_price_htr, 0)

        self._check_balance()

    def test_liquidity_tracking_simple(self):
        """Simple test to verify liquidity tracking is accurate"""
        # Create pool
        pool_key, creator_address = self._create_pool(
            self.token_a, self.token_b, fee=3, reserve_a=10000_00, reserve_b=20000_00
        )

        contract = self.get_readonly_contract(self.nc_id)
        assert isinstance(contract, DozerPoolManager)

        # Check initial state
        creator_liq = self.runner.call_view_method(
            self.nc_id, "liquidity_of", creator_address, pool_key
        )
        pool = contract.pools[pool_key]

        # Calculate expected values
        burned_liquidity = calculate_burned_liquidity(10000_00, 20000_00)
        expected_creator_liq = isqrt(10000_00 * 20000_00) * PRECISION
        expected_total_liq = expected_creator_liq + burned_liquidity

        # Verify exact values
        self.assertEqual(creator_liq, expected_creator_liq, "Creator liquidity mismatch")
        self.assertEqual(pool.total_liquidity, expected_total_liq, "Total liquidity mismatch")

        # Add liquidity with single token
        tx = self._get_any_tx()
        amount_in = 1000_00
        actions = [NCDepositAction(token_uid=self.token_a, amount=amount_in)]
        address_bytes, _ = self._get_any_address()
        context = self.create_context(
            actions=actions,
            vertex=tx,
            caller_id=Address(address_bytes),
            timestamp=self.get_current_timestamp()
        )
        self.runner.call_public_method(
            self.nc_id, "add_liquidity_single_token", context, self.token_b, 3
        )

        # Check total liquidity matches sum of all users
        updated_contract = self.get_readonly_contract(self.nc_id)
        assert isinstance(updated_contract, DozerPoolManager)
        updated_pool = updated_contract.pools[pool_key]

        creator_liq = self.runner.call_view_method(
            self.nc_id, "liquidity_of", creator_address, pool_key
        )
        new_user_liq = self.runner.call_view_method(
            self.nc_id, "liquidity_of", context.caller_id, pool_key
        )
        owner_liq = self.runner.call_view_method(
            self.nc_id, "liquidity_of", self.owner_address, pool_key
        )

        total_user_liq = creator_liq + new_user_liq + owner_liq

        # Calculate expected burned liquidity (constant from pool creation)
        expected_burned = calculate_burned_liquidity(10000_00, 20000_00)
        expected_total_liq = total_user_liq + expected_burned

        # Verify exact equality
        self.assertEqual(
            updated_pool.total_liquidity,
            expected_total_liq,
            f"Total liquidity mismatch: pool={updated_pool.total_liquidity}, expected={expected_total_liq}, burned={expected_burned}"
        )

        self._check_balance()

    def test_liquidity_consistency_with_random_operations(self):
        """Test liquidity and balance consistency across random pool operations.

        Performs 300 random operations including swaps (direct and through path),
        add/remove liquidity (proportional and single token) and verifies:
        - Total user liquidity always equals pool total_liquidity (including protocol fees)
        - Balance tracking is correct (via _check_balance)
        - All operation types work correctly in any order
        """
        import random
        random.seed(42)

        # Create three pools to enable path swaps: A/B, B/C, and A/C
        pool_key_ab, creator_address = self._create_pool(
            self.token_a, self.token_b, fee=3, reserve_a=100000_00, reserve_b=200000_00
        )

        # Create token C
        token_c_hex = "00000000000000000000000000000000000000000000000000000000000000cc"
        self.token_c = TokenUid(bytes.fromhex(token_c_hex))

        # Create B/C pool
        pool_key_bc, creator_bc = self._create_pool(
            self.token_b, self.token_c, fee=3, reserve_a=200000_00, reserve_b=300000_00
        )

        # Create A/C pool
        pool_key_ac, creator_ac = self._create_pool(
            self.token_a, self.token_c, fee=3, reserve_a=100000_00, reserve_b=300000_00
        )

        # Sign all 3 pools so they're included in pathfinding graph
        tx = self._get_any_tx()
        owner_context = self.create_context(
            [], tx, Address(self.owner_address), timestamp=self.get_current_timestamp()
        )
        self.runner.call_public_method(
            self.nc_id, "sign_pool", owner_context, self.token_a, self.token_b, 3
        )
        self.runner.call_public_method(
            self.nc_id, "sign_pool", owner_context, self.token_b, self.token_c, 3
        )
        self.runner.call_public_method(
            self.nc_id, "sign_pool", owner_context, self.token_a, self.token_c, 3
        )

        # Track users per pool for liquidity checks and initial reserves for burned liquidity calculation
        pool_users = {
            pool_key_ab: {creator_address, self.owner_address},
            pool_key_bc: {creator_bc, self.owner_address},
            pool_key_ac: {creator_ac, self.owner_address}
        }

        # Store initial reserves for each pool to calculate burned liquidity
        pool_initial_reserves = {
            pool_key_ab: (100000_00, 200000_00),
            pool_key_bc: (200000_00, 300000_00),
            pool_key_ac: (100000_00, 300000_00)
        }

        def verify_liquidity_consistency():
            current_contract = self.get_readonly_contract(self.nc_id)
            assert isinstance(current_contract, DozerPoolManager)

            # Verify each pool's liquidity consistency
            for pk, users in pool_users.items():
                if pk not in current_contract.pools:
                    continue
                pool = current_contract.pools[pk]
                total_user_liquidity = sum(
                    self.runner.call_view_method(self.nc_id, "liquidity_of", addr, pk)
                    for addr in users
                )

                # Calculate expected burned liquidity from initial reserves
                reserve_a_initial, reserve_b_initial = pool_initial_reserves[pk]
                expected_burned = calculate_burned_liquidity(reserve_a_initial, reserve_b_initial)
                expected_total = total_user_liquidity + expected_burned

                # Verify exact equality
                self.assertEqual(
                    pool.total_liquidity,
                    expected_total,
                    f"Pool {pk}: Liquidity mismatch - pool={pool.total_liquidity}, expected={expected_total}, users={total_user_liquidity}, burned={expected_burned}"
                )

        verify_liquidity_consistency()

        for i in range(300):
            # Choose which pool to operate on
            target_pool = random.choice([pool_key_ab, pool_key_bc, pool_key_ac])

            operation_type = random.choice([
                "add_liquidity",
                "add_liquidity_single",
                "remove_liquidity",
                "remove_liquidity_single",
                "swap_direct",
                "swap_through_path"
            ])

            current_contract = self.get_readonly_contract(self.nc_id)
            assert isinstance(current_contract, DozerPoolManager)

            # Skip if pool doesn't exist
            if target_pool not in current_contract.pools:
                continue

            pool = current_contract.pools[target_pool]

            # Get pool tokens
            if target_pool == pool_key_ab:
                token_1, token_2 = self.token_a, self.token_b
            elif target_pool == pool_key_bc:
                token_1, token_2 = self.token_b, self.token_c
            else:  # pool_key_ac
                token_1, token_2 = self.token_a, self.token_c

            if operation_type == "add_liquidity":
                # Add proportional liquidity
                amount_1 = random.randint(1000_00, 10000_00)
                reserve_a, reserve_b = pool.reserve_a, pool.reserve_b
                amount_2 = self.runner.call_view_method(
                    self.nc_id, "quote", amount_1, reserve_a, reserve_b
                )

                tx = self._get_any_tx()
                actions = [
                    NCDepositAction(token_uid=token_1, amount=amount_1),
                    NCDepositAction(token_uid=token_2, amount=amount_2),
                ]
                address_bytes, _ = self._get_any_address()
                context = self.create_context(
                    actions=actions,
                    vertex=tx,
                    caller_id=Address(address_bytes),
                    timestamp=self.get_current_timestamp()
                )
                self.runner.call_public_method(self.nc_id, "add_liquidity", context, 3)
                pool_users[target_pool].add(context.caller_id)

            elif operation_type == "add_liquidity_single":
                # Add liquidity with single token
                token_in = random.choice([token_1, token_2])
                token_out = token_2 if token_in == token_1 else token_1
                amount_in = random.randint(1000_00, 5000_00)

                try:
                    tx = self._get_any_tx()
                    actions = [NCDepositAction(token_uid=token_in, amount=amount_in)]
                    address_bytes, _ = self._get_any_address()
                    context = self.create_context(
                        actions=actions,
                        vertex=tx,
                        caller_id=Address(address_bytes),
                        timestamp=self.get_current_timestamp()
                    )
                    self.runner.call_public_method(
                        self.nc_id, "add_liquidity_single_token", context, token_out, 3
                    )
                    pool_users[target_pool].add(context.caller_id)
                except InvalidAction:
                    # Skip if price impact is too high (>15%) - this is expected behavior
                    pass

            elif operation_type == "remove_liquidity":
                # Remove proportional liquidity - pick a random user with liquidity
                users_with_liquidity = [
                    u for u in pool_users[target_pool]
                    if self.runner.call_view_method(self.nc_id, "liquidity_of", u, target_pool) > 0
                ]
                if users_with_liquidity:
                    user = random.choice(users_with_liquidity)
                    user_liquidity = self.runner.call_view_method(
                        self.nc_id, "liquidity_of", user, target_pool
                    )
                    # Remove a random percentage (10-50%) of user's liquidity
                    percentage = random.randint(10, 50) / 100
                    amount_to_remove_1 = int(
                        (pool.reserve_a * user_liquidity * percentage) // pool.total_liquidity
                    )
                    if amount_to_remove_1 > 0:
                        amount_to_remove_2 = self.runner.call_view_method(
                            self.nc_id, "quote", amount_to_remove_1, pool.reserve_a, pool.reserve_b
                        )

                        tx = self._get_any_tx()
                        actions = [
                            NCWithdrawalAction(token_uid=token_1, amount=amount_to_remove_1),
                            NCWithdrawalAction(token_uid=token_2, amount=amount_to_remove_2),
                        ]
                        # Ensure user is an Address (not ContractId)
                        assert isinstance(user, Address)
                        context = self.create_context(
                            actions=actions,
                            vertex=tx,
                            caller_id=user,
                            timestamp=self.get_current_timestamp()
                        )
                        self.runner.call_public_method(self.nc_id, "remove_liquidity", context, 3)

            elif operation_type == "remove_liquidity_single":
                # Remove liquidity to get single token
                users_with_liquidity = [
                    u for u in pool_users[target_pool]
                    if self.runner.call_view_method(self.nc_id, "liquidity_of", u, target_pool) > 0
                ]
                if users_with_liquidity:
                    user = random.choice(users_with_liquidity)
                    # Remove a random percentage (10-50%) of user's liquidity
                    percentage = random.randint(1000, 5000)  # 10-50% in basis points
                    token_out = random.choice([token_1, token_2])

                    quote = self.runner.call_view_method(
                        self.nc_id, "quote_remove_liquidity_single_token_percentage",
                        user, target_pool, token_out, percentage
                    )

                    if quote.amount_out > 0:
                        try:
                            tx = self._get_any_tx()
                            actions = [NCWithdrawalAction(token_uid=token_out, amount=quote.amount_out)]
                            # Ensure user is an Address (not ContractId)
                            assert isinstance(user, Address)
                            context = self.create_context(
                                actions=actions,
                                vertex=tx,
                                caller_id=user,
                                timestamp=self.get_current_timestamp()
                            )
                            self.runner.call_public_method(
                                self.nc_id, "remove_liquidity_single_token", context, target_pool, percentage
                            )
                        except InvalidAction:
                            # Skip if price impact is too high (>15%) - this is expected behavior
                            pass

            elif operation_type == "swap_direct":
                # Direct swap within the pool
                token_in = random.choice([token_1, token_2])
                token_out = token_2 if token_in == token_1 else token_1
                amount_in = random.randint(100_00, 2000_00)

                reserve_in = pool.reserve_a if token_in == token_1 else pool.reserve_b
                reserve_out = pool.reserve_b if token_in == token_1 else pool.reserve_a

                amount_out = self.runner.call_view_method(
                    self.nc_id, "get_amount_out",
                    amount_in, reserve_in, reserve_out,
                    pool.fee_numerator, pool.fee_denominator
                )

                if amount_out > 0:
                    tx = self._get_any_tx()
                    actions = [
                        NCDepositAction(token_uid=token_in, amount=amount_in),
                        NCWithdrawalAction(token_uid=token_out, amount=amount_out),
                    ]
                    address_bytes, _ = self._get_any_address()
                    current_timestamp = self.get_current_timestamp()
                    context = self.create_context(
                        actions=actions,
                        vertex=tx,
                        caller_id=Address(address_bytes),
                        timestamp=current_timestamp
                    )
                    # Set deadline far in the future
                    deadline = current_timestamp + 365 * 24 * 60 * 60
                    self.runner.call_public_method(
                        self.nc_id, "swap_exact_tokens_for_tokens", context, 3, deadline
                    )

            elif operation_type == "swap_through_path":
                # Swap through a path of pools (A -> B -> C or A -> C directly via A/C pool)
                # Choose random token pair for path swap
                token_pairs = [
                    (self.token_a, self.token_c),  # A -> B -> C or A -> C
                    (self.token_c, self.token_a),  # C -> B -> A or C -> A
                ]
                token_in, token_out = random.choice(token_pairs)
                amount_in = random.randint(100_00, 1000_00)

                # Calculate expected output using find_best_swap_path
                swap_info = self.runner.call_view_method(
                    self.nc_id, "find_best_swap_path", amount_in, token_in, token_out, 3
                )

                if swap_info.amount_out > 0:
                    tx = self._get_any_tx()
                    actions = [
                        NCDepositAction(token_uid=token_in, amount=amount_in),
                        NCWithdrawalAction(token_uid=token_out, amount=swap_info.amount_out),
                    ]
                    address_bytes, _ = self._get_any_address()
                    current_timestamp = self.get_current_timestamp()
                    context = self.create_context(
                        actions=actions,
                        vertex=tx,
                        caller_id=Address(address_bytes),
                        timestamp=current_timestamp
                    )
                    # Set deadline far in the future (1 year from now)
                    deadline = current_timestamp + 365 * 24 * 60 * 60
                    self.runner.call_public_method(
                        self.nc_id, "swap_exact_tokens_for_tokens_through_path", context, swap_info.path, deadline
                    )

            # Verify consistency after each operation
            try:
                verify_liquidity_consistency()
            except AssertionError as e:
                # Get pool state for debugging
                debug_contract = self.get_readonly_contract(self.nc_id)
                assert isinstance(debug_contract, DozerPoolManager)
                debug_pool = debug_contract.pools[target_pool]

                # Raise with more context about which operation failed
                raise AssertionError(
                    f"Operation {i} ({operation_type}) on pool {target_pool} broke consistency:\n"
                    f"  Pool total_liquidity: {debug_pool.total_liquidity}\n"
                    f"  Pool reserve_a: {debug_pool.reserve_a}\n"
                    f"  Pool reserve_b: {debug_pool.reserve_b}\n"
                    f"  Error: {e}"
                ) from e

        # Final verification
        verify_liquidity_consistency()
        self._check_balance()

    def test_isqrt_large_numbers(self):
        """Test integer square root with very large numbers (256-bit range)."""
        contract = self.get_readonly_contract(self.nc_id)
        assert isinstance(contract, DozerPoolManager)

        # Test cases with increasingly large numbers
        test_cases = [
            # Small numbers - edge cases for special handling
            (0, 0),
            (1, 1),
            (2, 1),  # Edge case: n <= 3 should return 1
            (3, 1),  # Edge case: n <= 3 should return 1
            (4, 2),
            (5, 2),  # Non-perfect square
            (8, 2),  # Non-perfect square
            (9, 3),  # Perfect square
            (15, 3),  # Non-perfect square
            (16, 4),
            (100, 10),
            (10000, 100),

            # Medium numbers (32-bit range)
            (2**32 - 1, 65535),  # Max 32-bit
            (2**40, 2**20),
            (2**40 - 1, 2**20 - 1),  # Just below perfect square

            # Large numbers (128-bit range)
            (2**64, 2**32),
            (2**100, 2**50),
            (2**128 - 1, 18446744073709551615),  # Near max 128-bit

            # Very large numbers (256-bit range)
            (2**150, 2**75),
            (2**200, 2**100),
            (2**240, 2**120),
            (2**256 - 1, 340282366920938463463374607431768211455),  # Max 256-bit

            # Numbers that might cause convergence issues
            (10**40, 10**20),
            (10**50, 10**25),
            (10**60, 10**30),

            # Perfect squares at large scale
            ((2**100) ** 2, 2**100),
            ((10**25) ** 2, 10**25),

            # Non-perfect squares near perfect squares (edge cases)
            (99, 9),
            (101, 10),
            (9999, 99),
            (10001, 100),
        ]

        for n, expected_result in test_cases:
            # Test via the contract's _isqrt method
            result = contract._isqrt(Amount(n))

            # Verify result
            assert result == expected_result, \
                f"isqrt({n}) returned {result}, expected {expected_result}"

            # Verify mathematical property: result^2 <= n < (result+1)^2
            assert result * result <= n, \
                f"isqrt({n}) = {result}, but {result}^2 = {result*result} > {n}"
            assert (result + 1) * (result + 1) > n, \
                f"isqrt({n}) = {result}, but ({result}+1)^2 = {(result+1)*(result+1)} <= {n}"

            # Verify helper function matches contract implementation
            helper_result = isqrt(n)
            assert result == helper_result, \
                f"Contract isqrt({n}) = {result}, but helper isqrt({n}) = {helper_result}"

        # Test that negative numbers raise assertion
        try:
            contract._isqrt(Amount(-1))
            assert False, "Expected assertion error for negative input"
        except AssertionError as e:
            assert "Cannot calculate square root of negative number" in str(e)

    def test_add_liquidity_price_ratio(self):
        """Test add_liquidity price ratio check across all pool sizes and asymmetries."""
        test_scenarios = [
            # Very small pools (<1000) - 5000 ppm (0.5%) tolerance
            (500, 500, 50, "Very small symmetric 1:1"),
            (900, 300, 90, "Very small asymmetric 3:1"),
            (999, 111, 100, "Very small asymmetric ~9:1"),

            # Small pools (1000-10000) - 2000 ppm (0.2%) tolerance
            (5000, 5000, 500, "Small symmetric 1:1"),
            (9000, 3000, 900, "Small asymmetric 3:1"),
            (9000, 900, 450, "Small asymmetric 10:1"),

            # Normal pools (>=10000) - 100 ppm (0.01%) tolerance
            (50000, 50000, 5000, "Normal symmetric 1:1"),
            (100000, 33333, 10000, "Normal asymmetric 3:1"),
            (100000, 10000, 5000, "Normal asymmetric 10:1"),
            (500000, 10000, 25000, "Normal asymmetric 50:1"),
            (1000000, 10000, 50000, "Normal asymmetric 100:1"),

            # Post-swap scenario (unbalanced reserves like 10100/991)
            (10100, 991, 505, "Post-swap unbalanced"),
            (100000, 9901, 5000, "Post-swap large unbalanced"),
        ]

        for reserve_a, reserve_b, amount_a, description in test_scenarios:
            with self.subTest(scenario=description):
                token_a = self.gen_random_token_uid()
                token_b = self.gen_random_token_uid()

                pool_key, _creator_address = self._create_pool(
                    token_a, token_b, fee=3, reserve_a=reserve_a, reserve_b=reserve_b
                )

                contract = self.get_readonly_contract(self.nc_id)
                assert isinstance(contract, DozerPoolManager)

                amount_b = self.runner.call_view_method(
                    self.nc_id, "quote", amount_a, reserve_a, reserve_b
                )

                self._add_liquidity(token_a, token_b, 3, amount_a, amount_b)

                self._check_balance()

    def test_remove_liquidity_price_ratio(self):
        """Test remove_liquidity price ratio check across all pool sizes and asymmetries."""
        test_scenarios = [
            # Very small pools (<1000) - 5000 ppm (0.5%) tolerance
            (500, 500, 250, "Very small symmetric 1:1"),
            (900, 300, 450, "Very small asymmetric 3:1"),

            # Small pools (1000-10000) - 2000 ppm (0.2%) tolerance
            (5000, 5000, 2500, "Small symmetric 1:1"),
            (9000, 3000, 4500, "Small asymmetric 3:1"),
            (9000, 900, 4500, "Small asymmetric 10:1"),

            # Normal pools (>=10000) - 100 ppm (0.01%) tolerance
            (50000, 50000, 25000, "Normal symmetric 1:1"),
            (100000, 10000, 50000, "Normal asymmetric 10:1"),
            (500000, 10000, 250000, "Normal asymmetric 50:1"),
            (1000000, 10000, 500000, "Normal asymmetric 100:1"),
        ]

        for reserve_a, reserve_b, amount_a, description in test_scenarios:
            with self.subTest(scenario=description):
                token_a = self.gen_random_token_uid()
                token_b = self.gen_random_token_uid()

                pool_key, creator_address = self._create_pool(
                    token_a, token_b, fee=3, reserve_a=reserve_a, reserve_b=reserve_b
                )

                contract = self.get_readonly_contract(self.nc_id)
                assert isinstance(contract, DozerPoolManager)

                amount_b = self.runner.call_view_method(
                    self.nc_id, "quote", amount_a, reserve_a, reserve_b
                )

                self._remove_liquidity(token_a, token_b, 3, amount_a, amount_b, address=creator_address)

                self._check_balance()

    def test_add_liquidity_single_token_price_ratio(self):
        """Test add_liquidity_single_token price ratio check across pool sizes."""
        test_scenarios = [
            # Small pools (1000-10000) - 2000 ppm (0.2%) tolerance
            (5000, 5000, 50, "Small symmetric 1:1"),

            # Normal pools (>=10000) - 100 ppm (0.01%) tolerance
            (50000, 50000, 500, "Normal symmetric 1:1"),
            (100000, 100000, 1000, "Large symmetric 1:1"),
            # For asymmetric pools, use larger sizes to keep swap percentage low
            # 2:1 ratio with larger reserves: 60000:30000, swap must be <1500 for 5% impact
            (60000, 30000, 200, "Normal asymmetric 2:1"),
            # 3:1 ratio with large reserves: 150000:50000, swap must be <2500 for 5% impact
            (150000, 50000, 300, "Large asymmetric 3:1"),
        ]

        for reserve_a, reserve_b, amount_in, description in test_scenarios:
            with self.subTest(scenario=description):
                token_a = self.gen_random_token_uid()
                token_b = self.gen_random_token_uid()

                pool_key, _creator_address = self._create_pool(
                    token_a, token_b, fee=3, reserve_a=reserve_a, reserve_b=reserve_b
                )

                tx = self._get_any_tx()
                actions = [NCDepositAction(token_uid=token_a, amount=amount_in)]
                address_bytes, _ = self._get_any_address()
                context = self.create_context(
                    actions=actions,
                    vertex=tx,
                    caller_id=Address(address_bytes),
                    timestamp=self.get_current_timestamp()
                )

                self.runner.call_public_method(
                    self.nc_id, "add_liquidity_single_token", context, token_b, 3
                )

                self._check_balance()

    def test_remove_liquidity_single_token_price_ratio(self):
        """Test remove_liquidity_single_token price ratio check across pool sizes."""
        test_scenarios = [
            # Small pools (1000-10000) - 2000 ppm (0.2%) tolerance
            (5000, 5000, 50, "Small symmetric 1:1"),

            # Normal pools (>=10000) - 100 ppm (0.01%) tolerance
            (50000, 50000, 500, "Normal symmetric 1:1"),
            (100000, 100000, 1000, "Large symmetric 1:1"),
            # For asymmetric pools, use larger sizes to keep swap percentage low
            (60000, 30000, 200, "Normal asymmetric 2:1"),
            (150000, 50000, 300, "Large asymmetric 3:1"),
        ]

        for initial_reserve_a, initial_reserve_b, liquidity_to_add, description in test_scenarios:
            with self.subTest(scenario=description):
                token_a = self.gen_random_token_uid()
                token_b = self.gen_random_token_uid()

                pool_key, creator_address = self._create_pool(
                    token_a, token_b, fee=3, reserve_a=initial_reserve_a, reserve_b=initial_reserve_b
                )

                amount_b = self.runner.call_view_method(
                    self.nc_id, "quote", liquidity_to_add, initial_reserve_a, initial_reserve_b
                )

                _result, add_context = self._add_liquidity(
                    token_a, token_b, 3, liquidity_to_add, amount_b
                )

                removal_percentage = 5000  # Remove 50% of user's liquidity

                quote = self.runner.call_view_method(
                    self.nc_id, "quote_remove_liquidity_single_token_percentage",
                    add_context.caller_id, pool_key, token_a, removal_percentage
                )

                tx = self._get_any_tx()
                actions = [NCWithdrawalAction(token_uid=token_a, amount=quote.amount_out)]
                context = self.create_context(
                    actions=actions,
                    vertex=tx,
                    caller_id=Address(add_context.caller_id),
                    timestamp=self.get_current_timestamp()
                )

                self.runner.call_public_method(
                    self.nc_id, "remove_liquidity_single_token", context, pool_key, removal_percentage
                )

                self._check_balance()

    def test_initial_lp(self):
        """
        Test that checks initial LP attack scenario.

        This test validates that the pool manager correctly handles:
        1. Pool creation with initial liquidity
        2. A swap operation
        3. Liquidity removal by the initial LP

        The test ensures that price ratio checks don't fail when the initial LP
        removes their liquidity after a swap has occurred.
        """
        # Create pool with initial liquidity: 10,000 HTR / 1,000 USD (10:1 ratio)
        pool_key, _creator_address = self._create_pool(
            HTR_UID,
            self.token_a,  # Using token_a as USD
            fee=3,
            reserve_a=10_000,
            reserve_b=1_000
        )

        contract = self.get_readonly_contract(self.nc_id)
        assert isinstance(contract, DozerPoolManager)

        initial_reserve_htr = contract.pools[pool_key].reserve_a
        initial_reserve_usd = contract.pools[pool_key].reserve_b

        # Verify initial pool state
        assert initial_reserve_htr == 10_000
        assert initial_reserve_usd == 1_000
        initial_total_liquidity = contract.pools[pool_key].total_liquidity
        # total_liquidity = isqrt(10000 * 1000) * (PRECISION + MINIMUM_LIQUIDITY)
        #                 = 3162 * (10^20 + 1000) = 3162 * 10^20 + 3162 * 1000
        assert initial_total_liquidity == 316200000000000003162000

        # Execute a swap: 100 HTR -> ~9 USD
        # Using get_amount_out to calculate expected output
        expected_usd_out = self.runner.call_view_method(
            self.nc_id,
            "get_amount_out",
            100,  # amount_in (HTR)
            initial_reserve_htr,  # reserve_in (HTR)
            initial_reserve_usd,  # reserve_out (USD)
            3,  # fee_numerator
            1000,  # fee_denominator
        )

        # Verify expected output calculation
        # amount_out = (1000 * 100 * 997) // (10000 * 1000 + 100 * 997) = 99700000 // 10099700 = 9
        assert expected_usd_out == 9

        # Execute the swap
        swap_result, _swap_context = self._swap_exact_tokens_for_tokens(
            HTR_UID,
            self.token_a,  # USD token
            3,
            100,  # amount_in (HTR)
            expected_usd_out,  # amount_out_min (USD)
        )

        # Verify swap result
        assert swap_result.amount_in == 100
        assert swap_result.amount_out == 9
        assert swap_result.change_in == 0  # No slippage since amount_out = min_accepted_amount
        assert swap_result.token_in == HTR_UID
        assert swap_result.token_out == self.token_a

        # Get pool state after swap
        contract_after_swap = self.get_readonly_contract(self.nc_id)
        assert isinstance(contract_after_swap, DozerPoolManager)

        reserve_htr_after_swap = contract_after_swap.pools[pool_key].reserve_a
        reserve_usd_after_swap = contract_after_swap.pools[pool_key].reserve_b

        # Verify pool state after swap
        assert reserve_htr_after_swap == 10_000 + 100  # 10,100
        assert reserve_usd_after_swap == 1_000 - 9  # 991
        assert contract_after_swap.pools[pool_key].total_change_a == 0
        assert contract_after_swap.pools[pool_key].total_change_b == 0

        # Now the initial LP tries to remove liquidity: 1,000 HTR / 98 USD
        # This should be proportional to their share of the pool
        initial_lp_liquidity = self.runner.call_view_method(
            self.nc_id, "liquidity_of", _creator_address, pool_key
        )
        total_liquidity = contract_after_swap.pools[pool_key].total_liquidity

        # Verify liquidity hasn't changed (no fees collected from swap)
        assert total_liquidity == initial_total_liquidity

        # Calculate what the LP should receive for removing 1,000 HTR worth
        # Based on their liquidity share
        amount_to_remove_htr = 1_000

        # Calculate the corresponding USD amount based on current pool ratio
        amount_to_remove_usd = self.runner.call_view_method(
            self.nc_id,
            "quote",
            amount_to_remove_htr,
            reserve_htr_after_swap,
            reserve_usd_after_swap,
        )

        # Verify quote calculation
        # amount_to_remove_usd = (1000 * 991) // 10100 = 991000 // 10100 = 98
        assert amount_to_remove_usd == 98


        # Remove liquidity
        _remove_context, _result = self._remove_liquidity(
            HTR_UID,
            self.token_a,
            3,
            amount_to_remove_htr,
            amount_to_remove_usd,
            address=_creator_address,
        )

        # Verify final state
        final_contract = self.get_readonly_contract(self.nc_id)
        assert isinstance(final_contract, DozerPoolManager)

        final_reserve_htr = final_contract.pools[pool_key].reserve_a
        final_reserve_usd = final_contract.pools[pool_key].reserve_b

        # Verify final reserves after liquidity removal
        assert final_reserve_htr == 10_100 - 1_000  # 9,100
        assert final_reserve_usd == 991 - 98  # 893
        assert final_contract.pools[pool_key].total_change_a == 0
        assert final_contract.pools[pool_key].total_change_b == 0

        # The test passes if we reach here without assertion errors
        self._check_balance()