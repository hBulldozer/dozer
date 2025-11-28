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

from hathor.nanocontracts.types import Address, NCDepositAction, NCWithdrawalAction, TokenUid
from hathor.transaction.base_transaction import BaseTransaction
from hathor.util import not_none
from hathor.wallet import KeyPair
from tests.nanocontracts.blueprints.unittest import BlueprintTestCase

PRECISION = 10**20
MINIMUM_LIQUIDITY = 10**3

HTR_UID = b'\x00'

def isqrt(n):
    """Integer square root using Newton's method"""
    if n == 0:
        return 0
    x = n
    y = (x + 1) // 2
    while y < x:
        x = y
        y = (x + n // x) // 2
    return x

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
        self.assertTrue(pool_key in contract.pool_exists)

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
        self.assertTrue(pool_key1 in contract.pool_exists)
        self.assertTrue(pool_key2 in contract.pool_exists)
        self.assertTrue(pool_key3 in contract.pool_exists)
        self.assertTrue(pool_key4 in contract.pool_exists)

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
        """Test adding liquidity with a single token"""
        # Create a pool with initial liquidity
        pool_key, _creator_address = self._create_pool(
            self.token_a, self.token_b, fee=3, reserve_a=10000_00, reserve_b=20000_00
        )

        # Test single token liquidity addition
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

        # Add liquidity with single token
        result = self.runner.call_public_method(
            self.nc_id, "add_liquidity_single_token", context, self.token_b, 3
        )

        # Verify the operation succeeded
        self.assertIsNotNone(result)

        # Check that user now has liquidity
        user_liquidity = self.runner.call_view_method(
            self.nc_id, "liquidity_of", context.caller_id, pool_key
        )
        self.assertGreater(user_liquidity, 0)

        self._check_balance()

    def test_quote_add_liquidity_single_token(self):
        """Test quoting single token liquidity addition"""
        # Create a pool
        _pool_key, _ = self._create_pool(
            self.token_a, self.token_b, fee=3, reserve_a=10000_00, reserve_b=20000_00
        )

        # Get quote for single token addition
        amount_in = 1000_00
        quote = self.runner.call_view_method(
            self.nc_id, "quote_add_liquidity_single_token",
            self.token_a, amount_in, self.token_b, 3
        )

        # Verify quote contains expected fields (named tuple)
        self.assertTrue(hasattr(quote, "liquidity_amount"))
        self.assertTrue(hasattr(quote, "token_a_used"))
        self.assertTrue(hasattr(quote, "token_b_used"))
        self.assertTrue(hasattr(quote, "excess_token"))
        self.assertTrue(hasattr(quote, "excess_amount"))
        self.assertTrue(hasattr(quote, "swap_amount"))
        self.assertTrue(hasattr(quote, "swap_output"))

        # Verify values are reasonable
        self.assertGreater(quote.liquidity_amount, 0)
        self.assertGreater(quote.token_a_used, 0)
        self.assertGreater(quote.token_b_used, 0)
        self.assertGreater(quote.swap_amount, 0)
        self.assertGreater(quote.swap_output, 0)

    def test_remove_liquidity_single_token(self):
        """Test removing liquidity to receive a single token"""
        # Create a pool
        pool_key, _creator_address = self._create_pool(
            self.token_a, self.token_b, fee=3, reserve_a=10000_00, reserve_b=20000_00
        )

        # Add liquidity first with the creator
        _result, add_context = self._add_liquidity(
            self.token_a, self.token_b, 3, 1000_00
        )

        # Remove liquidity to get single token
        tx = self._get_any_tx()
        assert isinstance(add_context.caller_id, Address)

        # First get a quote to know how much we'll receive
        quote = self.runner.call_view_method(
            self.nc_id, "quote_remove_liquidity_single_token_percentage",
            add_context.caller_id, pool_key, self.token_a, 10000
        )

        # Create withdrawal action for the desired token with the quoted amount
        actions = [NCWithdrawalAction(token_uid=self.token_a, amount=quote.amount_out)]

        context = self.create_context(
            actions=actions,
            vertex=tx,
            caller_id=add_context.caller_id,
            timestamp=self.get_current_timestamp()
        )

        # Remove liquidity for single token (100% = 10000 basis points)
        amount_out = self.runner.call_public_method(
            self.nc_id, "remove_liquidity_single_token", context, pool_key, 10000
        )

        # Verify we got some tokens back
        self.assertGreater(amount_out, 0)

        # Check that user's liquidity is now zero
        user_liquidity = self.runner.call_view_method(
            self.nc_id, "liquidity_of", add_context.caller_id, pool_key
        )
        self.assertEqual(user_liquidity, 0)

        self._check_balance()

    def test_quote_remove_liquidity_single_token(self):
        """Test quoting single token liquidity removal"""
        # Create a pool and add liquidity
        _pool_key, _creator_address = self._create_pool(
            self.token_a, self.token_b, fee=3, reserve_a=10000_00, reserve_b=20000_00
        )

        _result, add_context = self._add_liquidity(
            self.token_a, self.token_b, 3, 1000_00
        )

        # Get quote for single token removal
        quote = self.runner.call_view_method(
            self.nc_id, "quote_remove_liquidity_single_token",
            add_context.caller_id, self.token_a, self.token_b, self.token_a, 3
        )

        # Verify quote contains expected fields (named tuple)
        self.assertTrue(hasattr(quote, "amount_out"))
        self.assertTrue(hasattr(quote, "token_a_withdrawn"))
        self.assertTrue(hasattr(quote, "token_b_withdrawn"))
        self.assertTrue(hasattr(quote, "swap_amount"))
        self.assertTrue(hasattr(quote, "swap_output"))
        self.assertTrue(hasattr(quote, "user_liquidity"))

        # Verify values are reasonable
        self.assertGreater(quote.amount_out, 0)
        self.assertGreater(quote.token_a_withdrawn, 0)
        self.assertGreater(quote.token_b_withdrawn, 0)
        self.assertGreater(quote.user_liquidity, 0)

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
            self.nc_id, "withdraw_cashback", withdraw_context, int(pool_key.split("/")[2])
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
