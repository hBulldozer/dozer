import os
import random
from hathor.crypto.util import decode_address
from hathor.nanocontracts.blueprints.dozer_pool_v1_1 import Dozer_Pool_v1_1
from hathor.nanocontracts.blueprints.oasis import Oasis
from hathor.nanocontracts.types import NCAction, NCActionType
from hathor.pycoin import htr
from hathor.util import not_none
from hathor.conf.get_settings import HathorSettings
from hathor.wallet.keypair import KeyPair
from tests.nanocontracts.blueprints.unittest import BlueprintTestCase

from hathor.nanocontracts import Context, NCFail

settings = HathorSettings()
HTR_UID = settings.HATHOR_TOKEN_UID
PRECISION = 10**20
MONTHS_IN_SECONDS = 60


class OasisTestCase(BlueprintTestCase):
    _enable_sync_v1 = True
    _enable_sync_v2 = True

    def setUp(self):
        super().setUp()

        # Set up Oasis contract
        self.oasis_id = self.gen_random_nanocontract_id()
        self.runner.register_contract(Oasis, self.oasis_id)
        self.oasis_storage = self.runner.get_storage(self.oasis_id)

        # Set up Dozer Pool contract
        self.dozer_id = self.gen_random_nanocontract_id()
        self.runner.register_contract(Dozer_Pool_v1_1, self.dozer_id)
        self.dozer_storage = self.runner.get_storage(self.dozer_id)
        self.dev_address = self._get_any_address()[0]
        self.owner_address = self._get_any_address()[0]
        self.token_b = self.gen_random_token_uid()
        # Initialize base tx for contexts
        self.tx = self.get_genesis_tx()

    def _get_any_address(self) -> tuple[bytes, KeyPair]:
        password = os.urandom(12)
        key = KeyPair.create(password)
        address_b58 = key.address
        address_bytes = decode_address(not_none(address_b58))
        return address_bytes, key

    def _get_user_bonus(self, timelock: int, amount: int) -> int:
        """Calculates the bonus for a user based on the timelock and amount"""
        if timelock not in [6, 9, 12]:  # Assuming these are the only valid values
            raise NCFail("Invalid timelock value")
        bonus_multiplier = {6: 0.1, 9: 0.15, 12: 0.2}

        return int(bonus_multiplier[timelock] * amount)  # type: ignore

    def _quote_add_liquidity_in(self, amount: int) -> int:
        return self.runner.call_view_method(
            self.dozer_id, "front_quote_add_liquidity_in", amount, self.token_b
        )

    def _get_oasis_lp_amount_b(self) -> int:
        return self.runner.call_view_method(
            self.dozer_id,
            "max_withdraw_b",
            self.oasis_id,
        )

    def _quote_remove_liquidity_oasis(self) -> dict[str, int]:
        return self.runner.call_view_method(
            self.dozer_id, "quote_remove_liquidity", self.oasis_id
        )

    def _user_info(self, address: bytes) -> dict[str, float]:
        return self.runner.call_view_method(self.oasis_id, "user_info", address)

    def check_balances(self, users_addresses: list[bytes]) -> None:
        oasis_balance_htr = self.oasis_storage.get_balance(HTR_UID)
        oasis_balance_b = self.oasis_storage.get_balance(self.token_b)

        users_balances_a = sum(
            [self._user_info(address)["user_balance_a"] for address in users_addresses]
        )
        users_balances_b = sum(
            [self._user_info(address)["user_balance_b"] for address in users_addresses]
        )
        users_closed_balances_a = sum(
            [
                self._user_info(address)["closed_balance_a"]
                for address in users_addresses
            ]
        )
        users_closed_balances_b = sum(
            [
                self._user_info(address)["closed_balance_b"]
                for address in users_addresses
            ]
        )

        oasis_htr_balance = self.oasis_storage.get("oasis_htr_balance")

        # The LP HTR was already accounted for when positions were created
        self.assertEqual(
            oasis_balance_htr,
            oasis_htr_balance + users_balances_a + users_closed_balances_a,
        )
        self.assertEqual(oasis_balance_b, users_balances_b + users_closed_balances_b)

    def initialize_oasis(
        self, amount: int = 10_000_000_00, protocol_fee: int = 0
    ) -> None:
        """Test basic initialization"""
        ctx = Context(
            [
                NCAction(NCActionType.DEPOSIT, HTR_UID, amount),  # type: ignore
            ],
            self.tx,
            self.dev_address,
            timestamp=0,
        )
        self.runner.call_public_method(
            self.oasis_id,
            "initialize",
            ctx,
            self.dozer_id,
            self.token_b,
            protocol_fee,
        )
        # self.assertIsNone(self.oasis_storage.get("dozer_pool"))

    def initialize_pool(
        self, amount_htr: int = 1000000, amount_b: int = 7000000
    ) -> None:
        """Test basic initialization"""
        # Initialize dozer pool first
        actions = [
            NCAction(NCActionType.DEPOSIT, HTR_UID, amount_htr),  # type: ignore
            NCAction(NCActionType.DEPOSIT, self.token_b, amount_b),  # type: ignore
        ]
        pool_ctx = Context(actions, self.tx, self.dev_address, timestamp=0)  # type: ignore
        self.runner.call_public_method(
            self.dozer_id,
            "initialize",
            pool_ctx,
            HTR_UID,
            self.token_b,
            0,  # fee
            50,  # protocol fee
        )

    def test_owner_and_dev_deposit(self) -> None:
        dev_initial_deposit = 1_000_000_00
        owner_initial_deposit = 2_000_000_00
        self.initialize_pool()
        self.initialize_oasis(amount=dev_initial_deposit)

        # Update owner address to a different address
        new_owner_address = self._get_any_address()[0]
        update_ctx = Context([], self.tx, self.dev_address, timestamp=0)
        self.runner.call_public_method(
            self.oasis_id, "update_owner_address", update_ctx, new_owner_address
        )
        self.owner_address = new_owner_address  # Update our local reference

        # Test owner deposit
        ctx = Context(
            [NCAction(NCActionType.DEPOSIT, HTR_UID, owner_initial_deposit)],
            self.tx,
            self.owner_address,
            timestamp=0,
        )
        self.runner.call_public_method(self.oasis_id, "owner_deposit", ctx)

        # Verify total balance
        self.assertEqual(
            self.oasis_storage.get("oasis_htr_balance"),
            dev_initial_deposit + owner_initial_deposit,
        )

        # Test dev deposit
        dev_second_deposit = 500_000_00
        ctx = Context(
            [NCAction(NCActionType.DEPOSIT, HTR_UID, dev_second_deposit)],
            self.tx,
            self.dev_address,
            timestamp=0,
        )
        self.runner.call_public_method(self.oasis_id, "owner_deposit", ctx)

        # Verify updated total balance
        self.assertEqual(
            self.oasis_storage.get("oasis_htr_balance"),
            dev_initial_deposit + owner_initial_deposit + dev_second_deposit,
        )

        # Test unauthorized deposit
        random_address = self._get_any_address()[0]
        ctx = Context(
            [NCAction(NCActionType.DEPOSIT, HTR_UID, 1_000_00)],
            self.tx,
            random_address,
            timestamp=0,
        )
        with self.assertRaises(NCFail):
            self.runner.call_public_method(self.oasis_id, "owner_deposit", ctx)

    def test_owner_withdraw(self) -> None:
        dev_initial_deposit = 1_000_000_00
        self.initialize_pool()
        self.initialize_oasis(amount=dev_initial_deposit)

        # Initially, owner is the dev
        withdraw_amount = 500_000_00
        ctx = Context(
            [NCAction(NCActionType.WITHDRAWAL, HTR_UID, withdraw_amount)],
            self.tx,
            self.dev_address,  # Use dev_address as owner
            timestamp=0,
        )
        self.runner.call_public_method(self.oasis_id, "owner_withdraw", ctx)

        # Verify balance after withdrawal
        self.assertEqual(
            self.oasis_storage.get("oasis_htr_balance"),
            dev_initial_deposit - withdraw_amount,
        )

        # Update owner to a new address
        new_owner = self._get_any_address()[0]
        ctx = Context([], self.tx, self.dev_address, timestamp=0)
        self.runner.call_public_method(
            self.oasis_id, "update_owner_address", ctx, new_owner
        )

        # Test withdrawal with new owner
        ctx = Context(
            [NCAction(NCActionType.WITHDRAWAL, HTR_UID, 100_00)],
            self.tx,
            new_owner,
            timestamp=0,
        )
        self.runner.call_public_method(self.oasis_id, "owner_withdraw", ctx)

        # Test unauthorized withdrawal from original dev (who is no longer owner)
        ctx = Context(
            [NCAction(NCActionType.WITHDRAWAL, HTR_UID, 100_00)],
            self.tx,
            self.dev_address,
            timestamp=0,
        )
        with self.assertRaises(NCFail):
            self.runner.call_public_method(self.oasis_id, "owner_withdraw", ctx)

    def test_dev_withdraw_fee(self) -> None:
        dev_initial_deposit = 1_000_000_00
        protocol_fee = 50  # 5%
        self.initialize_pool()
        self.initialize_oasis(amount=dev_initial_deposit, protocol_fee=protocol_fee)

        # Make user deposit to generate fees
        user_address = self._get_any_address()[0]
        deposit_amount = 1_000_00
        ctx = Context(
            [NCAction(NCActionType.DEPOSIT, self.token_b, deposit_amount)],
            self.tx,
            user_address,
            timestamp=self.clock.seconds(),
        )
        self.runner.call_public_method(self.oasis_id, "user_deposit", ctx, 6, 0.03)

        # Calculate expected fee
        expected_fee = (deposit_amount * protocol_fee) // 1000

        # Test dev fee withdrawal
        ctx = Context(
            [NCAction(NCActionType.WITHDRAWAL, self.token_b, expected_fee)],
            self.tx,
            self.dev_address,
            timestamp=0,
        )
        self.runner.call_public_method(self.oasis_id, "dev_withdraw_fee", ctx)

        # Verify dev balance after withdrawal
        dev_info = self.runner.call_view_method(
            self.oasis_id, "user_info", self.dev_address
        )
        self.assertEqual(dev_info["user_balance_b"], 0)

        # Test unauthorized withdrawal
        # Create a new owner different from dev
        new_owner = self._get_any_address()[0]
        update_ctx = Context([], self.tx, self.dev_address, timestamp=0)
        self.runner.call_public_method(
            self.oasis_id, "update_owner_address", update_ctx, new_owner
        )

        # Owner shouldn't be able to withdraw fees (only dev can)
        ctx = Context(
            [NCAction(NCActionType.WITHDRAWAL, self.token_b, 100)],
            self.tx,
            new_owner,
            timestamp=0,
        )
        with self.assertRaises(NCFail):
            self.runner.call_public_method(self.oasis_id, "dev_withdraw_fee", ctx)

    def test_update_owner_address(self) -> None:
        dev_initial_deposit = 1_000_000_00
        self.initialize_pool()
        self.initialize_oasis(amount=dev_initial_deposit)

        # Verify initial owner is dev
        self.assertEqual(self.oasis_storage.get("owner_address"), self.dev_address)

        # Test owner update by dev
        new_owner = self._get_any_address()[0]
        ctx = Context([], self.tx, self.dev_address, timestamp=0)
        self.runner.call_public_method(
            self.oasis_id, "update_owner_address", ctx, new_owner
        )

        # Verify owner update
        self.assertEqual(self.oasis_storage.get("owner_address"), new_owner)

        # Test owner update by current owner
        newer_owner = self._get_any_address()[0]
        ctx = Context([], self.tx, new_owner, timestamp=0)
        self.runner.call_public_method(
            self.oasis_id, "update_owner_address", ctx, newer_owner
        )

        # Verify owner update
        self.assertEqual(self.oasis_storage.get("owner_address"), newer_owner)

        # Test unauthorized update
        random_address = self._get_any_address()[0]
        ctx = Context([], self.tx, random_address, timestamp=0)
        with self.assertRaises(NCFail):
            self.runner.call_public_method(
                self.oasis_id, "update_owner_address", ctx, random_address
            )

    def test_initialize(self) -> None:
        dev_initial_deposit = 10_000_000_00
        self.initialize_pool()
        self.initialize_oasis()
        self.assertEqual(
            self.oasis_storage.get("oasis_htr_balance"), dev_initial_deposit
        )
        # Verify owner is set to dev address
        self.assertEqual(self.oasis_storage.get("owner_address"), self.dev_address)

    def test_user_deposit(self, timelock=6) -> tuple[Context, int, int]:
        dev_initial_deposit = 10_000_000_00
        self.initialize_pool()
        self.initialize_oasis(amount=dev_initial_deposit)
        user_address = self._get_any_address()[0]
        now = self.clock.seconds()
        deposit_amount = 1_000_00
        ctx = Context(
            [
                NCAction(NCActionType.DEPOSIT, self.token_b, deposit_amount),  # type: ignore
            ],
            self.tx,
            user_address,
            timestamp=now,
        )
        self.runner.call_public_method(
            self.oasis_id, "user_deposit", ctx, timelock, 0.03
        )
        user_info = self.runner.call_view_method(
            self.oasis_id, "user_info", user_address
        )
        htr_amount = self._quote_add_liquidity_in(deposit_amount)
        user_bonus = self._get_user_bonus(timelock, htr_amount)
        self.assertEqual(user_info["user_deposit_b"], deposit_amount)
        self.assertEqual(user_info["user_balance_a"], user_bonus)
        # self.assertEqual(user_info["user_balance_b"], 0)
        self.assertEqual(user_info["user_liquidity"], deposit_amount * PRECISION)
        self.assertEqual(
            user_info["user_withdrawal_time"], now + timelock * MONTHS_IN_SECONDS
        )
        self.assertEqual(
            user_info["oasis_htr_balance"],
            dev_initial_deposit - htr_amount - user_bonus,
        )
        self.assertEqual(user_info["total_liquidity"], deposit_amount * PRECISION)
        self.check_balances([user_address])
        return ctx, timelock, htr_amount

    def test_multiple_user_deposit_no_repeat(self) -> None:
        dev_initial_deposit = 10_000_000_00
        self.initialize_pool()
        self.initialize_oasis(amount=dev_initial_deposit)
        n_users = 100
        user_addresses = [self._get_any_address()[0] for _ in range(n_users)]
        user_liquidity = [0] * n_users
        user_balances_a = [0] * n_users
        user_deposit_b = [0] * n_users
        total_liquidity = 0
        oasis_htr_balance = dev_initial_deposit
        for i, user_address in enumerate(user_addresses):
            now = self.clock.seconds()
            deposit_amount = 1_000_00
            ## random choice of timelock between the possibilities: 6,9 and 12
            timelock = random.choice([6, 9, 12])
            ctx = Context(
                [
                    NCAction(NCActionType.DEPOSIT, self.token_b, deposit_amount),  # type: ignore
                ],
                self.tx,
                user_address,
                timestamp=now,
            )
            lp_amount_b = self._get_oasis_lp_amount_b()
            self.runner.call_public_method(
                self.oasis_id, "user_deposit", ctx, timelock, 0.03
            )
            htr_amount = self._quote_add_liquidity_in(deposit_amount)
            bonus = self._get_user_bonus(timelock, htr_amount)
            user_info = self.runner.call_view_method(
                self.oasis_id, "user_info", user_address
            )
            if total_liquidity == 0:
                total_liquidity = deposit_amount * PRECISION
                user_liquidity[i] = deposit_amount * PRECISION
            else:
                liquidity_increase = (total_liquidity) * deposit_amount // lp_amount_b
                user_liquidity[i] = user_liquidity[i] + liquidity_increase
                total_liquidity += liquidity_increase

            oasis_htr_balance -= bonus + htr_amount
            user_balances_a[i] = user_balances_a[i] + bonus
            user_deposit_b[i] = deposit_amount
            self.assertEqual(user_info["oasis_htr_balance"], oasis_htr_balance)
            self.assertEqual(user_info["user_balance_a"], user_balances_a[i])
            self.assertEqual(user_info["user_deposit_b"], user_deposit_b[i])
            self.assertEqual(user_info["user_liquidity"], user_liquidity[i])
            self.assertEqual(
                user_info["user_withdrawal_time"],
                now + timelock * MONTHS_IN_SECONDS,
            )
            self.assertEqual(user_info["total_liquidity"], total_liquidity)
            self.assertEqual(user_info["oasis_htr_balance"], oasis_htr_balance)
        self.check_balances(user_addresses)

    def test_multiple_user_deposit_with_repeat(self) -> None:
        dev_initial_deposit = 10_000_000_00
        self.initialize_pool()
        self.initialize_oasis(amount=dev_initial_deposit)
        n_users = 10
        n_transactions = 500
        user_addresses = [self._get_any_address()[0] for _ in range(n_users)]
        user_liquidity = [0] * n_users
        user_balances_a = [0] * n_users
        user_deposit_b = [0] * n_users
        user_withdrawal_time = [0] * n_users
        total_liquidity = 0
        oasis_htr_balance = dev_initial_deposit
        initial_time = self.clock.seconds()
        for transaction in range(n_transactions):
            i = random.randint(0, n_users - 1)
            user_address = user_addresses[i]
            now = initial_time + transaction * 50
            deposit_amount = 1_000_00
            ## random choice of timelock between the possibilities: 6,9 and 12
            timelock = random.choice([6, 9, 12])
            ctx = Context(
                [
                    NCAction(NCActionType.DEPOSIT, self.token_b, deposit_amount),  # type: ignore
                ],
                self.tx,
                user_address,
                timestamp=now,
            )
            lp_amount_b = self._get_oasis_lp_amount_b()
            self.runner.call_public_method(
                self.oasis_id, "user_deposit", ctx, timelock, 0.03
            )
            htr_amount = self._quote_add_liquidity_in(deposit_amount)
            bonus = self._get_user_bonus(timelock, htr_amount)
            user_info = self.runner.call_view_method(
                self.oasis_id, "user_info", user_address
            )
            user_balances_a[i] += bonus
            if total_liquidity == 0:
                total_liquidity = deposit_amount * PRECISION
                user_liquidity[i] = deposit_amount * PRECISION
            else:
                liquidity_increase = (total_liquidity) * deposit_amount // lp_amount_b
                user_liquidity[i] = user_liquidity[i] + liquidity_increase
                total_liquidity += liquidity_increase

            if user_withdrawal_time[i] != 0:
                delta = user_withdrawal_time[i] - now
                if delta > 0:
                    user_withdrawal_time[i] = (
                        now
                        + (
                            (
                                (delta * user_deposit_b[i])
                                + (deposit_amount * timelock * MONTHS_IN_SECONDS)
                            )
                            // (user_deposit_b[i] + deposit_amount)
                        )
                        + 1
                    )
                else:
                    user_withdrawal_time[i] = now + timelock * MONTHS_IN_SECONDS
            else:
                user_withdrawal_time[i] = now + timelock * MONTHS_IN_SECONDS

            oasis_htr_balance -= bonus + htr_amount
            user_deposit_b[i] += deposit_amount
            self.assertEqual(user_info["oasis_htr_balance"], oasis_htr_balance)
            self.assertEqual(user_info["user_balance_a"], user_balances_a[i])
            self.assertEqual(user_info["user_deposit_b"], user_deposit_b[i])
            self.assertEqual(user_info["user_liquidity"], user_liquidity[i])
            self.assertEqual(user_info["user_withdrawal_time"], user_withdrawal_time[i])
            self.assertEqual(user_info["total_liquidity"], total_liquidity)
        self.check_balances(user_addresses)

    def test_user_withdraw_bonus(self):
        ctx_deposit, timelock, htr_amount = self.test_user_deposit()
        user_address = ctx_deposit.address
        action = ctx_deposit.actions.get(self.token_b) or NCAction(
            NCActionType.WITHDRAWAL, self.token_b, 0
        )
        deposit_amount = action.amount
        deposit_timestamp = ctx_deposit.timestamp
        user_info = self.runner.call_view_method(
            self.oasis_id, "user_info", user_address
        )
        bonus = self._get_user_bonus(timelock, htr_amount)
        self.assertEqual(user_info["user_deposit_b"], deposit_amount)
        self.assertEqual(user_info["user_balance_a"], bonus)
        # self.assertEqual(user_info["user_balance_b"], 0)
        self.assertEqual(user_info["user_liquidity"], deposit_amount * PRECISION)
        self.assertEqual(
            user_info["user_withdrawal_time"],
            deposit_timestamp + timelock * MONTHS_IN_SECONDS,
        )
        ctx_withdraw_bonus = Context(
            [
                NCAction(NCActionType.WITHDRAWAL, HTR_UID, bonus),  # type: ignore
            ],
            self.tx,
            user_address,
            timestamp=deposit_timestamp + 1,
        )
        self.runner.call_public_method(
            self.oasis_id, "user_withdraw_bonus", ctx_withdraw_bonus
        )
        self.log.info(f"{bonus=}")
        user_info = self.runner.call_view_method(
            self.oasis_id, "user_info", user_address
        )
        self.assertEqual(user_info["user_balance_a"], 0)
        # self.assertEqual(user_info["user_balance_b"], 0)
        ctx_withdraw_bonus_wrong = Context(
            [
                NCAction(NCActionType.WITHDRAWAL, HTR_UID, bonus + 1),  # type: ignore
            ],
            self.tx,
            user_address,
            timestamp=deposit_timestamp + 1,
        )
        with self.assertRaises(NCFail):
            self.runner.call_public_method(
                self.oasis_id, "user_withdraw_bonus", ctx_withdraw_bonus_wrong
            )

    def test_timelock_bonus_calculation(self):
        """Test that bonuses are calculated correctly for different timelocks"""
        dev_initial_deposit = 10_000_000_00
        self.initialize_pool()
        self.initialize_oasis(amount=dev_initial_deposit)

        test_cases = [
            (6, 0.10),  # 6 months = 10% bonus
            (9, 0.15),  # 9 months = 15% bonus
            (12, 0.20),  # 12 months = 20% bonus
        ]

        deposit_amount = 1_000_00

        for timelock, expected_bonus_rate in test_cases:
            user_address = self._get_any_address()[0]
            ctx = Context(
                [NCAction(NCActionType.DEPOSIT, self.token_b, deposit_amount)],
                self.tx,
                user_address,
                timestamp=self.clock.seconds(),
            )

            htr_amount = self._quote_add_liquidity_in(deposit_amount)
            self.runner.call_public_method(
                self.oasis_id, "user_deposit", ctx, timelock, 0.03
            )

            expected_bonus = int(expected_bonus_rate * htr_amount)

            user_info = self.runner.call_view_method(
                self.oasis_id, "user_info", user_address
            )
            self.assertEqual(user_info["user_balance_a"], expected_bonus)

    def test_multiple_deposits_varying_timelocks(self):
        """Test multiple users depositing with different timelocks"""
        dev_initial_deposit = 10_000_000_00
        self.initialize_pool()
        self.initialize_oasis(amount=dev_initial_deposit)

        # Create test users and scenarios
        num_users = 5
        scenarios = [
            {"deposit": 1_000_00, "timelock": 6},
            {"deposit": 2_000_00, "timelock": 9},
            {"deposit": 3_000_00, "timelock": 12},
            {"deposit": 1_500_00, "timelock": 6},
            {"deposit": 2_500_00, "timelock": 12},
        ]

        total_liquidity = 0
        users_data = []

        # Execute deposits
        for i in range(num_users):
            user_address = self._get_any_address()[0]
            deposit_amount = scenarios[i]["deposit"]
            timelock = scenarios[i]["timelock"]

            ctx = Context(
                [NCAction(NCActionType.DEPOSIT, self.token_b, deposit_amount)],
                self.tx,
                user_address,
                timestamp=self.clock.seconds() + (i * 100),
            )

            self.runner.call_public_method(
                self.oasis_id, "user_deposit", ctx, timelock, 0.03
            )

            # Store user data for verification
            htr_amount = self._quote_add_liquidity_in(deposit_amount)
            users_data.append(
                {
                    "address": user_address,
                    "deposit": deposit_amount,
                    "timelock": timelock,
                    "htr_amount": htr_amount,
                    "bonus": self._get_user_bonus(timelock, htr_amount),
                }
            )

        # Verify each user's position
        for user_data in users_data:
            user_info = self.runner.call_view_method(
                self.oasis_id, "user_info", user_data["address"]
            )

            # Check deposit amount
            self.assertEqual(user_info["user_deposit_b"], user_data["deposit"])

            # Check bonus calculation
            self.assertEqual(user_info["user_balance_a"], user_data["bonus"])

            # Check withdrawal timelock
            expected_unlock = self.clock.seconds() + (
                user_data["timelock"] * MONTHS_IN_SECONDS
            )
            self.assertLessEqual(
                abs(user_info["user_withdrawal_time"] - expected_unlock),
                user_data["timelock"] * MONTHS_IN_SECONDS,
            )
        self.check_balances([user["address"] for user in users_data])

    def test_early_position_closing_prevention(self):
        """Test that early position closing is prevented before timelock expiry"""
        dev_initial_deposit = 10_000_000_00
        self.initialize_pool()
        self.initialize_oasis(amount=dev_initial_deposit)

        # User deposits with 12-month lock
        deposit_amount = 1_000_00
        user_address = self._get_any_address()[0]
        timelock = 12
        deposit_time = self.clock.seconds()

        ctx = Context(
            [NCAction(NCActionType.DEPOSIT, self.token_b, deposit_amount)],
            self.tx,
            user_address,
            timestamp=deposit_time,
        )

        self.runner.call_public_method(
            self.oasis_id, "user_deposit", ctx, timelock, 0.03
        )

        # Try closing at different times before timelock expiry
        test_times = [
            1,  # Immediately after
            MONTHS_IN_SECONDS * 6,  # Halfway through
            (MONTHS_IN_SECONDS * 12) - 100,  # Just before expiry
        ]

        for time_delta in test_times:
            close_ctx = Context(
                [],
                self.tx,
                user_address,
                timestamp=deposit_time + time_delta,
            )

            with self.assertRaises(NCFail):
                self.runner.call_public_method(
                    self.oasis_id, "close_position", close_ctx
                )

        # Verify successful closing after timelock
        close_ctx = Context(
            [],
            self.tx,
            user_address,
            timestamp=deposit_time + (MONTHS_IN_SECONDS * 12) + 1,
        )

        self.runner.call_public_method(self.oasis_id, "close_position", close_ctx)

        # Verify position is closed
        user_info = self._user_info(user_address)
        self.assertEqual(user_info["position_closed"], True)

        def test_invalid_timelocks(self):
            """Test that invalid timelock values are rejected"""
            dev_initial_deposit = 10_000_000_00
            self.initialize_pool()
            self.initialize_oasis(amount=dev_initial_deposit)

            invalid_timelocks = [0, 3, 7, 8, 13, 24]  # Invalid timelock periods
            deposit_amount = 1_000_00
            user_address = self._get_any_address()[0]

            for invalid_timelock in invalid_timelocks:
                ctx = Context(
                    [NCAction(NCActionType.DEPOSIT, self.token_b, deposit_amount)],
                    self.tx,
                    user_address,
                    timestamp=self.clock.seconds(),
                )

                with self.assertRaises(NCFail):
                    self.runner.call_public_method(
                        self.oasis_id, "user_deposit", ctx, invalid_timelock, 0.03
                    )

    def test_exact_timelock_expiry(self):
        """Test withdrawals exactly at timelock expiry"""
        dev_initial_deposit = 10_000_000_00
        self.initialize_pool()
        self.initialize_oasis(amount=dev_initial_deposit)

        deposit_amount = 1_000_00
        timelock = 6  # 6 months
        user_address = self._get_any_address()[0]
        deposit_time = self.clock.seconds()

        # Make deposit
        deposit_ctx = Context(
            [NCAction(NCActionType.DEPOSIT, self.token_b, deposit_amount)],
            self.tx,
            user_address,
            timestamp=deposit_time,
        )

        self.runner.call_public_method(
            self.oasis_id, "user_deposit", deposit_ctx, timelock, 0.03
        )

        # Try withdrawal exactly at expiry
        exact_expiry = deposit_time + (timelock * MONTHS_IN_SECONDS)
        # Close the position first
        close_ctx = Context([], self.tx, user_address, timestamp=exact_expiry)
        self.runner.call_public_method(self.oasis_id, "close_position", close_ctx)

        # Get balances after closing
        user_info = self._user_info(user_address)
        closed_balance_b = int(user_info["closed_balance_b"])
        closed_balance_a = int(user_info["closed_balance_a"])

        # Update withdraw context to use closed balances
        withdraw_ctx = Context(
            [
                NCAction(NCActionType.WITHDRAWAL, self.token_b, closed_balance_b),
                NCAction(NCActionType.WITHDRAWAL, HTR_UID, closed_balance_a),
            ],
            self.tx,
            user_address,
            timestamp=exact_expiry,
        )

        # Should succeed at exact expiry
        self.runner.call_public_method(self.oasis_id, "user_withdraw", withdraw_ctx)

        # Verify withdrawal succeeded
        user_info = self.runner.call_view_method(
            self.oasis_id, "user_info", user_address
        )
        self.assertEqual(user_info["user_deposit_b"], 0)

    def test_overlapping_timelocks(self):
        """Test multiple deposits with overlapping timelock periods"""
        dev_initial_deposit = 10_000_000_00
        self.initialize_pool()
        self.initialize_oasis(amount=dev_initial_deposit)

        user_address = self._get_any_address()[0]
        initial_time = self.clock.seconds()

        # Make first deposit with 12 month lock
        deposit_1_amount = 1_000_00
        deposit_1_ctx = Context(
            [NCAction(NCActionType.DEPOSIT, self.token_b, deposit_1_amount)],
            self.tx,
            user_address,
            timestamp=initial_time,
        )
        self.runner.call_public_method(
            self.oasis_id, "user_deposit", deposit_1_ctx, 12, 0.03
        )

        # Make second deposit with 6 month lock after 3 months
        deposit_2_amount = 2_000_00
        deposit_2_ctx = Context(
            [NCAction(NCActionType.DEPOSIT, self.token_b, deposit_2_amount)],
            self.tx,
            user_address,
            timestamp=initial_time + (3 * MONTHS_IN_SECONDS),
        )
        self.runner.call_public_method(
            self.oasis_id, "user_deposit", deposit_2_ctx, 6, 0.03
        )

        user_info = self.runner.call_view_method(
            self.oasis_id, "user_info", user_address
        )

        # Calculate expected weighted timelock as per contract
        first_timelock_remaining = (
            initial_time
            + (12 * MONTHS_IN_SECONDS)
            - (initial_time + (3 * MONTHS_IN_SECONDS))
        )
        weighted_unlock = (
            (first_timelock_remaining * deposit_1_amount)
            + (deposit_2_amount * 6 * MONTHS_IN_SECONDS)
        ) // (deposit_1_amount + deposit_2_amount)
        expected_unlock_time = (
            initial_time + (3 * MONTHS_IN_SECONDS)
        ) + weighted_unlock

        # Verify weighted average timelock
        self.assertEqual(
            user_info["user_withdrawal_time"],
            expected_unlock_time + 1,  # Account for the +1 in contract
        )

        # Try withdrawal before weighted timelock - should fail
        early_close_ctx = Context(
            [],
            self.tx,
            user_address,
            timestamp=expected_unlock_time,
        )

        with self.assertRaises(NCFail):
            self.runner.call_public_method(
                self.oasis_id, "close_position", early_close_ctx
            )

        # Withdrawal after weighted timelock should succeed
        # Close the position first
        close_ctx = Context(
            [], self.tx, user_address, timestamp=expected_unlock_time + 1
        )
        self.runner.call_public_method(self.oasis_id, "close_position", close_ctx)

        # Get balances after closing
        user_info = self._user_info(user_address)
        closed_balance_b = int(user_info["closed_balance_b"])
        closed_balance_a = int(user_info["closed_balance_a"])

        # Update withdrawal context
        withdraw_ctx = Context(
            [
                NCAction(NCActionType.WITHDRAWAL, self.token_b, closed_balance_b),
                NCAction(NCActionType.WITHDRAWAL, HTR_UID, closed_balance_a),
            ],
            self.tx,
            user_address,
            timestamp=expected_unlock_time + 1,
        )

        self.runner.call_public_method(self.oasis_id, "user_withdraw", withdraw_ctx)

    def test_protocol_fee_zero(self) -> None:
        """Test deposits and withdrawals with zero protocol fee"""
        self.initialize_pool()
        self.initialize_oasis(amount=10_000_000_00, protocol_fee=0)

        user_address = self._get_any_address()[0]
        deposit_amount = 1_000_00
        timelock = 6

        ctx = Context(
            [NCAction(NCActionType.DEPOSIT, self.token_b, deposit_amount)],
            self.tx,
            user_address,
            timestamp=self.clock.seconds(),
        )

        self.runner.call_public_method(
            self.oasis_id, "user_deposit", ctx, timelock, 0.03
        )

        user_info = self.runner.call_view_method(
            self.oasis_id, "user_info", user_address
        )
        dev_info = self.runner.call_view_method(
            self.oasis_id, "user_info", self.dev_address
        )

        # With zero fee, full amount should go to user deposit
        self.assertEqual(user_info["user_deposit_b"], deposit_amount)
        self.assertEqual(dev_info["user_balance_b"], 0)

    def test_protocol_fee_max(self) -> None:
        """Test deposits and withdrawals with maximum protocol fee (1000 = 100%)"""
        self.initialize_pool()
        self.initialize_oasis(amount=10_000_000_00, protocol_fee=1000)

        user_address = self._get_any_address()[0]
        deposit_amount = 1_000_00
        timelock = 6

        ctx = Context(
            [NCAction(NCActionType.DEPOSIT, self.token_b, deposit_amount)],
            self.tx,
            user_address,
            timestamp=self.clock.seconds(),
        )

        self.runner.call_public_method(
            self.oasis_id, "user_deposit", ctx, timelock, 0.03
        )

        user_info = self.runner.call_view_method(
            self.oasis_id, "user_info", user_address
        )
        dev_info = self.runner.call_view_method(
            self.oasis_id, "user_info", self.dev_address
        )

        # With max fee, all tokens should go to dev
        self.assertEqual(user_info["user_deposit_b"], 0)
        self.assertEqual(dev_info["user_balance_b"], deposit_amount)

    def test_protocol_fee_rounding(self) -> None:
        """Test protocol fee rounding with various deposit amounts"""
        test_fee = 10  # 1%
        self.initialize_pool()
        self.initialize_oasis(amount=10_000_000_00, protocol_fee=test_fee)

        user_address = self._get_any_address()[0]
        deposit_amount = 995  # Will result in fee < 1
        timelock = 6

        ctx = Context(
            [NCAction(NCActionType.DEPOSIT, self.token_b, deposit_amount)],
            self.tx,
            user_address,
            timestamp=self.clock.seconds(),
        )

        self.runner.call_public_method(
            self.oasis_id, "user_deposit", ctx, timelock, 0.03
        )

        user_info = self.runner.call_view_method(
            self.oasis_id, "user_info", user_address
        )
        dev_info = self.runner.call_view_method(
            self.oasis_id, "user_info", self.dev_address
        )

        expected_fee = (deposit_amount * test_fee) // 1000
        expected_deposit = deposit_amount - expected_fee

        self.assertEqual(user_info["user_deposit_b"], expected_deposit)
        self.assertEqual(dev_info["user_balance_b"], expected_fee)

    def test_protocol_fee_updates(self) -> None:
        """Test protocol fee updates and validation"""
        test_cases = [
            (500, True),  # 0.5% - valid
            (1000, True),  # 1% - valid (max)
            (0, True),  # 0% - valid
            (1001, False),  # Over max - invalid
            (-1, False),  # Negative - invalid
        ]
        # Initialize pool and contract
        self.initialize_pool()

        for fee, should_succeed in test_cases:
            # Create new contract for each test
            oasis_id = self.gen_random_nanocontract_id()
            self.runner.register_contract(Oasis, oasis_id)
            oasis_storage = self.runner.get_storage(oasis_id)

            ctx = Context(
                [NCAction(NCActionType.DEPOSIT, HTR_UID, 10_000_000_00)],
                self.tx,
                self.dev_address,
                timestamp=0,
            )

            if should_succeed:
                self.runner.call_public_method(
                    oasis_id,
                    "initialize",
                    ctx,
                    self.dozer_id,
                    self.token_b,
                    fee,
                )
                # Verify owner is set to dev
                self.assertEqual(oasis_storage.get("owner_address"), self.dev_address)

                # Test deposit with fee
                user_address = self._get_any_address()[0]
                deposit_amount = 1_000_00

                deposit_ctx = Context(
                    [NCAction(NCActionType.DEPOSIT, self.token_b, deposit_amount)],
                    self.tx,
                    user_address,
                    timestamp=self.clock.seconds(),
                )

                self.runner.call_public_method(
                    oasis_id, "user_deposit", deposit_ctx, 6, 0.03
                )

                expected_fee = (deposit_amount * fee) // 1000
                expected_deposit = deposit_amount - expected_fee

                user_info = self.runner.call_view_method(
                    oasis_id, "user_info", user_address
                )
                dev_info = self.runner.call_view_method(
                    oasis_id, "user_info", self.dev_address
                )

                self.assertEqual(user_info["user_deposit_b"], expected_deposit)
                self.assertEqual(dev_info["user_balance_b"], expected_fee)

                oasis_info = self.runner.call_view_method(oasis_id, "oasis_info")
                self.assertEqual(oasis_info["protocol_fee"], fee)
            else:
                with self.assertRaises(NCFail):
                    self.runner.call_public_method(
                        oasis_id, "initialize", ctx, self.dozer_id, self.token_b, fee
                    )
                with self.assertRaises(NCFail):
                    self.runner.call_public_method(
                        oasis_id, "update_protocol_fee", ctx, fee
                    )

    def test_protocol_fee(self) -> None:
        """Test protocol fee collection and management"""
        initial_fee = 500  # 0.5%
        dev_initial_deposit = 10_000_000_00
        self.initialize_pool()
        self.initialize_oasis(amount=dev_initial_deposit, protocol_fee=initial_fee)

        # Verify initial fee
        oasis_info = self.runner.call_view_method(self.oasis_id, "oasis_info")
        self.assertEqual(oasis_info["protocol_fee"], initial_fee)

        # Test fee update
        new_fee = 750  # 0.75%
        ctx = Context([], self.tx, self.dev_address, timestamp=0)
        self.runner.call_public_method(
            self.oasis_id, "update_protocol_fee", ctx, new_fee
        )

        oasis_info = self.runner.call_view_method(self.oasis_id, "oasis_info")
        self.assertEqual(oasis_info["protocol_fee"], new_fee)

        # Test invalid fee update
        with self.assertRaises(NCFail):
            self.runner.call_public_method(
                self.oasis_id, "update_protocol_fee", ctx, 1001
            )

        # Test fee collection
        user_address = self._get_any_address()[0]
        deposit_amount = 1_000_00
        timelock = 6

        ctx = Context(
            [NCAction(NCActionType.DEPOSIT, self.token_b, deposit_amount)],
            self.tx,
            user_address,
            timestamp=self.clock.seconds(),
        )

        self.runner.call_public_method(
            self.oasis_id, "user_deposit", ctx, timelock, 0.03
        )

        # Calculate expected fee
        expected_fee = (deposit_amount * new_fee) // 1000
        expected_deposit = deposit_amount - expected_fee

        # Verify user deposit and fee collection
        user_info = self.runner.call_view_method(
            self.oasis_id, "user_info", user_address
        )
        dev_info = self.runner.call_view_method(
            self.oasis_id, "user_info", self.dev_address
        )

        self.assertEqual(user_info["user_deposit_b"], expected_deposit)
        self.assertEqual(dev_info["user_balance_b"], expected_fee)

        # Test unauthorized fee update
        non_admin_ctx = Context([], self.tx, user_address, timestamp=0)
        with self.assertRaises(NCFail):
            self.runner.call_public_method(
                self.oasis_id, "update_protocol_fee", non_admin_ctx, 500
            )

    def test_deposit_empty_pool(self):
        """Test depositing into a completely empty pool"""
        self.initialize_pool(amount_htr=0, amount_b=0)
        self.initialize_oasis(amount=10_000_000_00)

        user_address = self._get_any_address()[0]
        deposit_amount = 1_000_00
        timelock = 6

        ctx = Context(
            [NCAction(NCActionType.DEPOSIT, self.token_b, deposit_amount)],
            self.tx,
            user_address,
            timestamp=self.clock.seconds(),
        )

        with self.assertRaises(NCFail):
            self.runner.call_public_method(
                self.oasis_id, "user_deposit", ctx, timelock, 0.03
            )

    def test_deposit_extreme_ratio(self):
        """Test deposits when pool has extreme token ratios"""
        # Initialize with smaller ratio to avoid overflow
        self.initialize_pool(amount_htr=1_000_00, amount_b=100_00)
        self.initialize_oasis(amount=100_000_000_00)  # Increased dev deposit

        user_address = self._get_any_address()[0]
        deposit_amount = 10_00  # Smaller deposit
        timelock = 6

        initial_price = self.dozer_storage.get("reserve_a") / self.dozer_storage.get(
            "reserve_b"
        )

        ctx = Context(
            [NCAction(NCActionType.DEPOSIT, self.token_b, deposit_amount)],
            self.tx,
            user_address,
            timestamp=self.clock.seconds(),
        )

        self.runner.call_public_method(
            self.oasis_id, "user_deposit", ctx, timelock, 0.03
        )

        user_info = self.runner.call_view_method(
            self.oasis_id, "user_info", user_address
        )
        self.assertEqual(user_info["user_deposit_b"], deposit_amount)
        self.check_balances([user_address])

    def test_deposit_maximum_amounts(self):
        """Test deposits with maximum possible amounts"""
        max_amount = 2**63 - 1  # Max safe integer
        self.initialize_pool(amount_htr=max_amount // 2, amount_b=max_amount // 2)
        self.initialize_oasis(amount=max_amount)

        user_address = self._get_any_address()[0]
        deposit_amount = max_amount // 4  # Large but within bounds
        timelock = 6

        ctx = Context(
            [NCAction(NCActionType.DEPOSIT, self.token_b, deposit_amount)],
            self.tx,
            user_address,
            timestamp=self.clock.seconds(),
        )

        self.runner.call_public_method(
            self.oasis_id, "user_deposit", ctx, timelock, 0.03
        )

        user_info = self.runner.call_view_method(
            self.oasis_id, "user_info", user_address
        )
        self.assertEqual(user_info["user_deposit_b"], deposit_amount)
        self.check_balances([user_address])

    def test_htr_price_in_deposit(self):
        """Test that htr_price_in_deposit is set correctly during deposits"""
        dev_initial_deposit = 10_000_000_00
        self.initialize_pool()
        self.initialize_oasis(amount=dev_initial_deposit)

        # First deposit with initial HTR price
        user_address = self._get_any_address()[0]
        deposit_amount = 1_000_00
        timelock = 6
        initial_htr_price = 0.03

        ctx = Context(
            [NCAction(NCActionType.DEPOSIT, self.token_b, deposit_amount)],
            self.tx,
            user_address,
            timestamp=self.clock.seconds(),
        )

        self.runner.call_public_method(
            self.oasis_id, "user_deposit", ctx, timelock, initial_htr_price
        )

        # Verify price is set correctly
        user_info = self.runner.call_view_method(
            self.oasis_id, "user_info", user_address
        )
        self.assertEqual(user_info["htr_price_in_deposit"], initial_htr_price)

        # Second deposit with different HTR price
        second_deposit_amount = 2_000_00
        second_htr_price = 0.04
        deposit_2_ctx = Context(
            [NCAction(NCActionType.DEPOSIT, self.token_b, second_deposit_amount)],
            self.tx,
            user_address,
            timestamp=self.clock.seconds() + 100,
        )

        self.runner.call_public_method(
            self.oasis_id, "user_deposit", deposit_2_ctx, timelock, second_htr_price
        )

        # Verify weighted average price calculation
        user_info = self.runner.call_view_method(
            self.oasis_id, "user_info", user_address
        )
        expected_weighted_price = (
            initial_htr_price * deposit_amount
            + second_htr_price * second_deposit_amount
        ) / (deposit_amount + second_deposit_amount)
        self.assertAlmostEqual(
            user_info["htr_price_in_deposit"], expected_weighted_price, places=6
        )

        # First close the position
        close_ctx = Context(
            [],
            self.tx,
            user_address,
            timestamp=self.clock.seconds() + (timelock * MONTHS_IN_SECONDS) + 1000,
        )
        self.runner.call_public_method(self.oasis_id, "close_position", close_ctx)

        # Get closed balances
        user_info = self._user_info(user_address)
        closed_balance_b = int(user_info["closed_balance_b"])
        closed_balance_a = int(user_info["closed_balance_a"])

        # Update withdraw context
        withdraw_ctx = Context(
            [
                NCAction(NCActionType.WITHDRAWAL, self.token_b, closed_balance_b),
                NCAction(NCActionType.WITHDRAWAL, HTR_UID, closed_balance_a),
            ],
            self.tx,
            user_address,
            timestamp=self.clock.seconds() + (timelock * MONTHS_IN_SECONDS) + 1000,
        )

        self.runner.call_public_method(self.oasis_id, "user_withdraw", withdraw_ctx)

        # Verify price is reset
        user_info = self.runner.call_view_method(
            self.oasis_id, "user_info", user_address
        )
        self.assertEqual(user_info["htr_price_in_deposit"], 0)

    def test_token_price_in_htr_in_deposit(self):
        """Test that token_price_in_htr_in_deposit is calculated and stored correctly"""
        dev_initial_deposit = 10_000_000_00
        self.initialize_pool()
        self.initialize_oasis(amount=dev_initial_deposit)

        # First deposit
        user_address = self._get_any_address()[0]
        deposit_amount = 1_000_00
        timelock = 6
        htr_price = 0.03

        ctx = Context(
            [NCAction(NCActionType.DEPOSIT, self.token_b, deposit_amount)],
            self.tx,
            user_address,
            timestamp=self.clock.seconds(),
        )

        # Calculate expected token price in HTR
        htr_amount = self._quote_add_liquidity_in(deposit_amount)
        expected_token_price_in_htr = deposit_amount / htr_amount

        self.runner.call_public_method(
            self.oasis_id, "user_deposit", ctx, timelock, htr_price
        )

        # Verify token price in HTR is calculated correctly
        user_info = self.runner.call_view_method(
            self.oasis_id, "user_info", user_address
        )
        self.assertAlmostEqual(
            user_info["token_price_in_htr_in_deposit"],
            expected_token_price_in_htr,
            places=6,
        )

        # Second deposit with different ratio
        second_deposit_amount = 2_000_00
        deposit_2_ctx = Context(
            [NCAction(NCActionType.DEPOSIT, self.token_b, second_deposit_amount)],
            self.tx,
            user_address,
            timestamp=self.clock.seconds() + 100,
        )

        # Calculate expected token price for second deposit
        second_htr_amount = self._quote_add_liquidity_in(second_deposit_amount)
        second_token_price_in_htr = second_deposit_amount / second_htr_amount

        # Calculate expected weighted average
        expected_weighted_price = (
            expected_token_price_in_htr * deposit_amount
            + second_token_price_in_htr * second_deposit_amount
        ) / (deposit_amount + second_deposit_amount)

        self.runner.call_public_method(
            self.oasis_id, "user_deposit", deposit_2_ctx, timelock, htr_price
        )

        # Verify weighted average price calculation
        user_info = self.runner.call_view_method(
            self.oasis_id, "user_info", user_address
        )
        self.assertAlmostEqual(
            user_info["token_price_in_htr_in_deposit"],
            expected_weighted_price,
            places=6,
        )

        # First close the position
        close_ctx = Context(
            [],
            self.tx,
            user_address,
            timestamp=self.clock.seconds() + (timelock * MONTHS_IN_SECONDS) + 1000,
        )
        self.runner.call_public_method(self.oasis_id, "close_position", close_ctx)

        # Get closed balances
        user_info = self._user_info(user_address)
        closed_balance_b = int(user_info["closed_balance_b"])
        closed_balance_a = int(user_info["closed_balance_a"])

        # Update withdraw context
        withdraw_ctx = Context(
            [
                NCAction(NCActionType.WITHDRAWAL, self.token_b, closed_balance_b),
                NCAction(NCActionType.WITHDRAWAL, HTR_UID, closed_balance_a),
            ],
            self.tx,
            user_address,
            timestamp=self.clock.seconds() + (timelock * MONTHS_IN_SECONDS) + 1000,
        )

        self.runner.call_public_method(self.oasis_id, "user_withdraw", withdraw_ctx)

        # Verify price is reset
        user_info = self.runner.call_view_method(
            self.oasis_id, "user_info", user_address
        )
        self.assertEqual(user_info["token_price_in_htr_in_deposit"], 0)

    def test_pool_drain_scenario(self):
        """Test behavior when pool is nearly drained of liquidity"""
        self.initialize_pool(amount_htr=1_000_000_00, amount_b=1_000_000_00)
        self.initialize_oasis(amount=10_000_000_00)

        # First user deposits
        user1_address = self._get_any_address()[0]
        deposit_amount = 50_000_00  # Smaller deposit

        ctx = Context(
            [NCAction(NCActionType.DEPOSIT, self.token_b, deposit_amount)],
            self.tx,
            user1_address,
            timestamp=self.clock.seconds(),
        )

        self.runner.call_public_method(self.oasis_id, "user_deposit", ctx, 6, 0.03)

        # Drain pool through repeated small swaps
        trading_address = self._get_any_address()[0]
        for _ in range(50):
            reserve_b = self.dozer_storage.get("reserve_b")
            if reserve_b <= 100:  # Leave some minimal liquidity
                break

            swap_amount = min(10_000_00, reserve_b // 4)  # Limited swap size
            amount_out = self.runner.call_view_method(
                self.dozer_id,
                "get_amount_out",
                swap_amount,
                self.dozer_storage.get("reserve_b"),
                self.dozer_storage.get("reserve_a"),
            )

            ctx = Context(
                [
                    NCAction(NCActionType.DEPOSIT, self.token_b, swap_amount),
                    NCAction(NCActionType.WITHDRAWAL, HTR_UID, amount_out),
                ],
                self.tx,
                trading_address,
                timestamp=self.clock.seconds(),
            )
            self.runner.call_public_method(
                self.dozer_id, "swap_exact_tokens_for_tokens", ctx
            )

        # Try withdrawal after timelock
        user_info = self.runner.call_view_method(
            self.oasis_id, "user_info", user1_address
        )
        max_withdraw_b = user_info["max_withdraw_b"]
        max_withdraw_htr = user_info["max_withdraw_htr"]

        # Close position first
        close_ctx = Context(
            [],
            self.tx,
            user1_address,
            timestamp=self.clock.seconds() + (6 * MONTHS_IN_SECONDS) + 1,
        )
        self.runner.call_public_method(self.oasis_id, "close_position", close_ctx)

        # Get closed balances
        user_info = self._user_info(user1_address)
        closed_balance_b = int(user_info["closed_balance_b"])
        closed_balance_a = int(user_info["closed_balance_a"])

        # Update context to withdraw closed balances
        ctx = Context(
            [
                NCAction(NCActionType.WITHDRAWAL, self.token_b, closed_balance_b),
                NCAction(NCActionType.WITHDRAWAL, HTR_UID, closed_balance_a),
            ],
            self.tx,
            user1_address,
            timestamp=self.clock.seconds() + (6 * MONTHS_IN_SECONDS) + 1,
        )

        self.runner.call_public_method(self.oasis_id, "user_withdraw", ctx)
        user_info = self.runner.call_view_method(
            self.oasis_id, "user_info", user1_address
        )
        self.assertEqual(user_info["user_deposit_b"], 0)
        self.check_balances([user1_address])

    def test_close_position_success(self):
        """Test basic position closing functionality"""
        # Create a user position
        ctx_deposit, timelock, htr_amount = self.test_user_deposit(timelock=6)
        user_address = ctx_deposit.address
        action = ctx_deposit.actions.get(self.token_b) or NCAction(
            NCActionType.WITHDRAWAL, self.token_b, 0
        )
        deposit_amount = action.amount
        initial_timestamp = ctx_deposit.timestamp

        # Get user balances before closing
        user_info_before = self._user_info(user_address)
        bonus = user_info_before["user_balance_a"]
        self.assertEqual(user_info_before["position_closed"], False)

        # Advance time to unlock the position
        unlock_time = initial_timestamp + (timelock * MONTHS_IN_SECONDS) + 1

        # Close the position
        close_ctx = Context([], self.tx, user_address, timestamp=unlock_time)

        self.runner.call_public_method(self.oasis_id, "close_position", close_ctx)

        # Verify position closed state
        user_info = self._user_info(user_address)
        self.assertEqual(user_info["position_closed"], True)
        self.assertEqual(user_info["user_liquidity"], 0)

        # Verify funds moved to closed_position_balances
        self.assertEqual(user_info["user_balance_a"], 0)
        self.assertEqual(user_info["user_balance_b"], 0)

        # The actual amounts might vary due to pool conditions, but should be non-zero
        self.assertGreater(user_info["closed_balance_a"], 0)
        self.assertGreater(user_info["closed_balance_b"], 0)

        # Check that closed_balance_b is approximately equal to deposit_amount
        self.assertAlmostEqual(
            user_info["closed_balance_b"] / deposit_amount, 1.0, delta=0.1
        )

        # Check that closed_balance_a includes bonus + LP value
        self.assertEqual(user_info["closed_balance_a"], bonus)

        # Validate contract balances
        self.check_balances([user_address])

    def test_close_position_locked(self):
        """Test that position closing fails when still locked"""
        # Create a user position with 12-month lock
        ctx_deposit, timelock, htr_amount = self.test_user_deposit(timelock=12)
        user_address = ctx_deposit.address
        initial_timestamp = ctx_deposit.timestamp

        # Try to close the position before unlocking (halfway through the lock period)
        close_ctx = Context(
            [],
            self.tx,
            user_address,
            timestamp=initial_timestamp + (6 * MONTHS_IN_SECONDS),
        )

        # Should fail because position is still locked
        with self.assertRaises(NCFail):
            self.runner.call_public_method(self.oasis_id, "close_position", close_ctx)

        # Verify position remains open
        user_info = self._user_info(user_address)
        self.assertEqual(user_info["position_closed"], False)
        self.assertEqual(user_info["closed_balance_a"], 0)
        self.assertEqual(user_info["closed_balance_b"], 0)

    def test_close_already_closed_position(self):
        """Test that closing an already-closed position fails"""
        # Create and close a position
        ctx_deposit, timelock, htr_amount = self.test_user_deposit(timelock=6)
        user_address = ctx_deposit.address
        initial_timestamp = ctx_deposit.timestamp
        unlock_time = initial_timestamp + (timelock * MONTHS_IN_SECONDS) + 1

        # Close the position
        close_ctx = Context([], self.tx, user_address, timestamp=unlock_time)

        self.runner.call_public_method(self.oasis_id, "close_position", close_ctx)

        # Try to close it again
        with self.assertRaises(NCFail):
            self.runner.call_public_method(self.oasis_id, "close_position", close_ctx)

        # Verify position remains closed with same values
        user_info = self._user_info(user_address)
        self.assertEqual(user_info["position_closed"], True)
        self.assertEqual(user_info["user_liquidity"], 0)

    def test_withdraw_from_closed_position(self):
        """Test withdrawing funds from a closed position"""
        # Create and close a position
        ctx_deposit, timelock, htr_amount = self.test_user_deposit(timelock=6)
        user_address = ctx_deposit.address
        initial_timestamp = ctx_deposit.timestamp
        unlock_time = initial_timestamp + (timelock * MONTHS_IN_SECONDS) + 1

        # Close the position
        close_ctx = Context([], self.tx, user_address, timestamp=unlock_time)

        self.runner.call_public_method(self.oasis_id, "close_position", close_ctx)

        # Get closed position balances
        user_info = self._user_info(user_address)
        closed_balance_a = int(user_info["closed_balance_a"])
        closed_balance_b = int(user_info["closed_balance_b"])

        # Withdraw all funds from closed position
        withdraw_ctx = Context(
            [
                NCAction(NCActionType.WITHDRAWAL, self.token_b, closed_balance_b),
                NCAction(NCActionType.WITHDRAWAL, HTR_UID, closed_balance_a),
            ],
            self.tx,
            user_address,
            timestamp=unlock_time,
        )

        self.runner.call_public_method(self.oasis_id, "user_withdraw", withdraw_ctx)

        # Verify all funds withdrawn and position data cleared
        user_info = self._user_info(user_address)
        self.assertEqual(user_info["closed_balance_a"], 0)
        self.assertEqual(user_info["closed_balance_b"], 0)
        self.assertEqual(user_info["user_deposit_b"], 0)
        self.assertEqual(user_info["user_withdrawal_time"], 0)
        self.assertEqual(
            user_info["position_closed"], False
        )  # Position is fully cleared

        # Validate contract balances
        self.check_balances([user_address])

    def test_partial_withdraw_from_closed_position(self):
        """Test partial withdrawal from a closed position"""
        # Create and close a position
        ctx_deposit, timelock, htr_amount = self.test_user_deposit(timelock=6)
        user_address = ctx_deposit.address
        initial_timestamp = ctx_deposit.timestamp
        unlock_time = initial_timestamp + (timelock * MONTHS_IN_SECONDS) + 1

        # Close the position
        close_ctx = Context([], self.tx, user_address, timestamp=unlock_time)

        self.runner.call_public_method(self.oasis_id, "close_position", close_ctx)

        # Get closed position balances
        user_info = self._user_info(user_address)
        closed_balance_a = int(user_info["closed_balance_a"])
        closed_balance_b = int(user_info["closed_balance_b"])

        # Withdraw half of token_b
        withdraw_amount_b = closed_balance_b // 2
        withdraw_ctx = Context(
            [
                NCAction(NCActionType.WITHDRAWAL, self.token_b, withdraw_amount_b),
            ],
            self.tx,
            user_address,
            timestamp=unlock_time,
        )

        self.runner.call_public_method(self.oasis_id, "user_withdraw", withdraw_ctx)

        # Verify partial withdrawal
        user_info = self._user_info(user_address)
        self.assertEqual(
            user_info["closed_balance_a"], closed_balance_a
        )  # HTR unchanged
        self.assertEqual(
            user_info["closed_balance_b"], closed_balance_b - withdraw_amount_b
        )
        self.assertEqual(user_info["position_closed"], True)  # Position remains closed

        # Withdraw remaining funds
        withdraw_ctx = Context(
            [
                NCAction(
                    NCActionType.WITHDRAWAL,
                    self.token_b,
                    closed_balance_b - withdraw_amount_b,
                ),
                NCAction(NCActionType.WITHDRAWAL, HTR_UID, closed_balance_a),
            ],
            self.tx,
            user_address,
            timestamp=unlock_time,
        )

        self.runner.call_public_method(self.oasis_id, "user_withdraw", withdraw_ctx)

        # Verify all funds withdrawn and position data cleared
        user_info = self._user_info(user_address)
        self.assertEqual(user_info["closed_balance_a"], 0)
        self.assertEqual(user_info["closed_balance_b"], 0)
        self.assertEqual(user_info["user_deposit_b"], 0)
        self.assertEqual(user_info["position_closed"], False)  # Position fully cleared

        # Validate contract balances
        self.check_balances([user_address])

    def test_withdraw_without_closing_position(self):
        """Test that withdrawal without closing position first fails"""
        # Create a position but don't close it
        ctx_deposit, timelock, htr_amount = self.test_user_deposit(timelock=6)
        user_address = ctx_deposit.address
        action = ctx_deposit.actions.get(self.token_b) or NCAction(
            NCActionType.WITHDRAWAL, self.token_b, 0
        )
        deposit_amount = action.amount
        initial_timestamp = ctx_deposit.timestamp
        unlock_time = initial_timestamp + (timelock * MONTHS_IN_SECONDS) + 1

        # Try to withdraw without closing the position first
        withdraw_ctx = Context(
            [
                NCAction(NCActionType.WITHDRAWAL, self.token_b, deposit_amount),
            ],
            self.tx,
            user_address,
            timestamp=unlock_time,
        )

        # Should fail because position must be closed first
        with self.assertRaises(NCFail):
            self.runner.call_public_method(self.oasis_id, "user_withdraw", withdraw_ctx)

        # Verify position remains unchanged
        user_info = self._user_info(user_address)
        self.assertEqual(user_info["position_closed"], False)
        self.assertEqual(user_info["closed_balance_a"], 0)
        self.assertEqual(user_info["closed_balance_b"], 0)

    def test_withdraw_excess_from_closed_position(self):
        """Test attempting to withdraw more than available from a closed position"""
        # Create and close a position
        ctx_deposit, timelock, htr_amount = self.test_user_deposit(timelock=6)
        user_address = ctx_deposit.address
        initial_timestamp = ctx_deposit.timestamp
        unlock_time = initial_timestamp + (timelock * MONTHS_IN_SECONDS) + 1

        # Close the position
        close_ctx = Context([], self.tx, user_address, timestamp=unlock_time)

        self.runner.call_public_method(self.oasis_id, "close_position", close_ctx)

        # Get closed position balances
        user_info = self._user_info(user_address)
        closed_balance_a = int(user_info["closed_balance_a"])
        closed_balance_b = int(user_info["closed_balance_b"])

        # Try to withdraw more than available
        withdraw_ctx = Context(
            [
                NCAction(NCActionType.WITHDRAWAL, self.token_b, closed_balance_b + 100),
            ],
            self.tx,
            user_address,
            timestamp=unlock_time,
        )

        # Should fail due to insufficient balance
        with self.assertRaises(NCFail):
            self.runner.call_public_method(self.oasis_id, "user_withdraw", withdraw_ctx)

        # Try to withdraw more HTR than available
        withdraw_ctx = Context(
            [
                NCAction(NCActionType.WITHDRAWAL, HTR_UID, closed_balance_a + 100),
            ],
            self.tx,
            user_address,
            timestamp=unlock_time,
        )

        # Should fail due to insufficient balance
        with self.assertRaises(NCFail):
            self.runner.call_public_method(self.oasis_id, "user_withdraw", withdraw_ctx)

        # Verify balances remain unchanged
        user_info = self._user_info(user_address)
        self.assertEqual(user_info["closed_balance_a"], closed_balance_a)
        self.assertEqual(user_info["closed_balance_b"], closed_balance_b)

    def test_impermanent_loss_when_closing_position(self):
        """Test impermanent loss compensation when closing a position"""
        # Initialize with larger amounts to allow for significant price movements
        dev_initial_deposit = 100_000_000_00
        pool_initial_htr = 10_000_000_00
        pool_initial_token_b = 1_000_000_00

        # Initialize contracts
        self.initialize_pool(amount_htr=pool_initial_htr, amount_b=pool_initial_token_b)
        self.initialize_oasis(amount=dev_initial_deposit)

        # User deposits with 12-month lock
        deposit_amount = 1_000_000_00
        user_address = self._get_any_address()[0]
        timelock = 12
        initial_timestamp = self.clock.seconds()

        ctx = Context(
            [NCAction(NCActionType.DEPOSIT, self.token_b, deposit_amount)],
            self.tx,
            user_address,
            timestamp=initial_timestamp,
        )

        self.runner.call_public_method(
            self.oasis_id, "user_deposit", ctx, timelock, 0.03
        )

        htr_amount = self._quote_add_liquidity_in(deposit_amount)
        bonus = self._get_user_bonus(timelock, htr_amount)

        # Capture initial price ratio
        initial_price = self.dozer_storage.get("reserve_a") / self.dozer_storage.get(
            "reserve_b"
        )

        # Create price impact by executing swaps
        # Add extra liquidity to support swaps
        extra_liquidity_address = self._get_any_address()[0]
        add_liquidity_ctx = Context(
            [
                NCAction(NCActionType.DEPOSIT, HTR_UID, pool_initial_htr * 10),
                NCAction(NCActionType.DEPOSIT, self.token_b, pool_initial_token_b * 10),
            ],
            self.tx,
            extra_liquidity_address,
            timestamp=initial_timestamp + 100,
        )
        self.runner.call_public_method(
            self.dozer_id, "add_liquidity", add_liquidity_ctx
        )

        # Execute swaps to crash token B price
        for _ in range(50):
            reserve_a = self.dozer_storage.get("reserve_a")
            reserve_b = self.dozer_storage.get("reserve_b")

            # To drive token_b price DOWN, we need to swap HTR FOR token_b
            # (not token_b for HTR as the original code does)
            swap_amount = reserve_a // 20  # Swap 5% of HTR each time
            amount_out = self.runner.call_view_method(
                self.dozer_id, "get_amount_out", swap_amount, reserve_a, reserve_b
            )

            swap_ctx = Context(
                [
                    NCAction(NCActionType.DEPOSIT, HTR_UID, swap_amount),
                    NCAction(NCActionType.WITHDRAWAL, self.token_b, amount_out),
                ],
                self.tx,
                extra_liquidity_address,
                timestamp=initial_timestamp + 200,
            )
            self.runner.call_public_method(
                self.dozer_id, "swap_exact_tokens_for_tokens", swap_ctx
            )

        # Capture post-swap price ratio
        final_price = self.dozer_storage.get("reserve_a") / self.dozer_storage.get(
            "reserve_b"
        )
        price_change_pct = (final_price - initial_price) / initial_price * 100

        # Calculate expected LP tokens without closing the position
        user_info_before_close = self._user_info(user_address)
        expected_user_lp_b = int(user_info_before_close["user_lp_b"])

        # Close the position
        unlock_time = initial_timestamp + (timelock * MONTHS_IN_SECONDS) + 1
        close_ctx = Context([], self.tx, user_address, timestamp=unlock_time)

        self.runner.call_public_method(self.oasis_id, "close_position", close_ctx)

        # Get user info after closing position
        user_info = self._user_info(user_address)

        # Verify position is closed
        self.assertEqual(user_info["position_closed"], True)
        self.assertEqual(user_info["user_liquidity"], 0)

        # Since token B crashed in value, we expect:
        # 1. closed_balance_b should be approximately equal to expected_user_lp_b
        # 2. closed_balance_a should include bonus + LP HTR + loss compensation

        self.assertLess(user_info["closed_balance_b"], deposit_amount)

        # Verify closed_balance_b matches expected LP tokens
        self.assertAlmostEqual(
            user_info["closed_balance_b"],
            expected_user_lp_b,
            delta=expected_user_lp_b * 0.01,  # Allow 1% variance
        )

        # Verify HTR balance includes compensation
        self.assertGreater(user_info["closed_balance_a"], bonus)

        # Validate contract balances
        self.check_balances([user_address])

    def test_close_position_with_no_impermanent_loss(self):
        """Test closing a position with minimal price impact"""
        # Create a position
        ctx_deposit, timelock, htr_amount = self.test_user_deposit(timelock=6)
        user_address = ctx_deposit.address
        action = ctx_deposit.actions.get(self.token_b) or NCAction(
            NCActionType.WITHDRAWAL, self.token_b, 0
        )
        deposit_amount = action.amount
        initial_timestamp = ctx_deposit.timestamp
        bonus = self._get_user_bonus(timelock, htr_amount)

        # Advance time to unlock the position
        unlock_time = initial_timestamp + (timelock * MONTHS_IN_SECONDS) + 1

        # Close the position with no price impact
        close_ctx = Context([], self.tx, user_address, timestamp=unlock_time)

        self.runner.call_public_method(self.oasis_id, "close_position", close_ctx)

        # Verify position closed and balances
        user_info = self._user_info(user_address)
        self.assertEqual(user_info["position_closed"], True)

        # Without impermanent loss, token_b should be approximately equal to deposit amount
        self.assertAlmostEqual(
            user_info["closed_balance_b"] / deposit_amount,
            1.0,
            delta=0.05,  # Allow 5% variance
        )

        # HTR balance should include bonus + proportional LP value
        self.assertGreaterEqual(user_info["closed_balance_a"], bonus)

        # Validate contract balances
        self.check_balances([user_address])

    def test_update_existing_test_user_withdraw_exact_value(self):
        """Updated version of test_user_withdraw_exact_value to use the two-step process"""
        ctx_deposit, timelock, htr_amount = self.test_user_deposit()
        user_address = ctx_deposit.address
        action = ctx_deposit.actions.get(self.token_b) or NCAction(
            NCActionType.WITHDRAWAL, self.token_b, 0
        )
        deposit_amount = action.amount
        deposit_timestamp = ctx_deposit.timestamp
        bonus = self._get_user_bonus(timelock, htr_amount)

        # First close the position
        close_timestamp = deposit_timestamp + timelock * MONTHS_IN_SECONDS + 1
        close_ctx = Context([], self.tx, user_address, timestamp=close_timestamp)

        self.runner.call_public_method(self.oasis_id, "close_position", close_ctx)

        # Verify position is closed
        user_info = self._user_info(user_address)
        self.assertEqual(user_info["position_closed"], True)
        self.assertEqual(user_info["user_liquidity"], 0)
        closed_balance_b = user_info["closed_balance_b"]
        closed_balance_a = user_info["closed_balance_a"]

        # Now withdraw from closed position
        withdraw_ctx = Context(
            [
                NCAction(NCActionType.WITHDRAWAL, self.token_b, int(closed_balance_b)),
                NCAction(NCActionType.WITHDRAWAL, HTR_UID, int(closed_balance_a)),
            ],
            self.tx,
            user_address,
            timestamp=close_timestamp,
        )

        self.runner.call_public_method(self.oasis_id, "user_withdraw", withdraw_ctx)

        # Verify all funds withdrawn and position data cleared
        user_info = self._user_info(user_address)
        self.assertEqual(user_info["closed_balance_a"], 0)
        self.assertEqual(user_info["closed_balance_b"], 0)
        self.assertEqual(user_info["user_deposit_b"], 0)
        self.assertEqual(user_info["user_withdrawal_time"], 0)
        self.assertEqual(user_info["position_closed"], False)

        # Validate contract balances
        self.check_balances([user_address])
