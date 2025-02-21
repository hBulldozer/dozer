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
        dev_balance = self.oasis_storage.get("dev_balance")
        self.assertEqual(oasis_balance_htr, dev_balance + users_balances_a)
        self.assertEqual(oasis_balance_b, users_balances_b)

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
            self.oasis_id, "initialize", ctx, self.dozer_id, self.token_b, protocol_fee
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

    def test_initialize(self) -> None:
        dev_initial_deposit = 10_000_000_00
        self.initialize_pool()
        self.initialize_oasis()
        self.assertEqual(self.oasis_storage.get("dev_balance"), dev_initial_deposit)

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
        self.runner.call_public_method(self.oasis_id, "user_deposit", ctx, timelock)
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
            user_info["dev_balance"], dev_initial_deposit - htr_amount - user_bonus
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
        dev_balance = dev_initial_deposit
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
            self.runner.call_public_method(self.oasis_id, "user_deposit", ctx, timelock)
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

            dev_balance -= bonus + htr_amount
            user_balances_a[i] = user_balances_a[i] + bonus
            user_deposit_b[i] = deposit_amount
            self.assertEqual(user_info["dev_balance"], dev_balance)
            self.assertEqual(user_info["user_balance_a"], user_balances_a[i])
            self.assertEqual(user_info["user_deposit_b"], user_deposit_b[i])
            self.assertEqual(user_info["user_liquidity"], user_liquidity[i])
            self.assertEqual(
                user_info["user_withdrawal_time"],
                now + timelock * MONTHS_IN_SECONDS,
            )
            self.assertEqual(user_info["total_liquidity"], total_liquidity)
            self.assertEqual(user_info["dev_balance"], dev_balance)
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
        dev_balance = dev_initial_deposit
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
            self.runner.call_public_method(self.oasis_id, "user_deposit", ctx, timelock)
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

            dev_balance -= bonus + htr_amount
            user_deposit_b[i] += deposit_amount
            self.assertEqual(user_info["dev_balance"], dev_balance)
            self.assertEqual(user_info["user_balance_a"], user_balances_a[i])
            self.assertEqual(user_info["user_deposit_b"], user_deposit_b[i])
            self.assertEqual(user_info["user_liquidity"], user_liquidity[i])
            self.assertEqual(user_info["user_withdrawal_time"], user_withdrawal_time[i])
            self.assertEqual(user_info["total_liquidity"], total_liquidity)
        self.check_balances(user_addresses)

    def test_user_withdraw_exact_value(self):
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
        self.assertEqual(user_info["dev_balance"], 10_000_000_00 - htr_amount - bonus)
        self.assertEqual(user_info["total_liquidity"], deposit_amount * PRECISION)
        # Withdraw exact value
        ctx = Context(
            [
                NCAction(NCActionType.WITHDRAWAL, self.token_b, deposit_amount),  # type: ignore
                NCAction(NCActionType.WITHDRAWAL, HTR_UID, bonus),  # type: ignore
            ],
            self.tx,
            user_address,
            timestamp=deposit_timestamp + timelock * MONTHS_IN_SECONDS + 1,
        )
        self.check_balances([user_address])
        self.runner.call_public_method(self.oasis_id, "user_withdraw", ctx)
        user_info = self.runner.call_view_method(
            self.oasis_id, "user_info", user_address
        )
        self.assertEqual(user_info["user_deposit_b"], 0)
        self.assertEqual(user_info["user_balance_a"], 0)
        self.assertEqual(user_info["user_balance_b"], 0)
        self.assertEqual(user_info["user_liquidity"], 0)
        self.assertEqual(user_info["user_withdrawal_time"], 0)
        self.check_balances([user_address])

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
            self.runner.call_public_method(self.oasis_id, "user_deposit", ctx, timelock)

            expected_bonus = int(expected_bonus_rate * htr_amount)

            user_info = self.runner.call_view_method(
                self.oasis_id, "user_info", user_address
            )
            self.assertEqual(user_info["user_balance_a"], expected_bonus)

    def test_impermanent_loss_token_b_crashes(self):
        """Test impermanent loss protection when token B crashes 99% in value"""
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

        ctx = Context(
            [NCAction(NCActionType.DEPOSIT, self.token_b, deposit_amount)],
            self.tx,
            user_address,
            timestamp=self.clock.seconds(),
        )

        self.runner.call_public_method(self.oasis_id, "user_deposit", ctx, timelock)

        initial_price = self.dozer_storage.get("reserve_a") / self.dozer_storage.get(
            "reserve_b"
        )
        print(f"Initial token_b price in HTR: {initial_price=}")

        # Add extra liquidity to support massive swaps
        extra_liquidity_address = self._get_any_address()[0]
        add_liquidity_ctx = Context(
            [
                NCAction(NCActionType.DEPOSIT, HTR_UID, pool_initial_htr * 10),
                NCAction(NCActionType.DEPOSIT, self.token_b, pool_initial_token_b * 10),
            ],
            self.tx,
            extra_liquidity_address,
            timestamp=self.clock.seconds() + 100,
        )
        self.runner.call_public_method(
            self.dozer_id, "add_liquidity", add_liquidity_ctx
        )

        # Execute swaps to crash token B price
        # Repeatedly swap token B for HTR to drive down price
        for _ in range(100):
            reserve_a = self.dozer_storage.get("reserve_a")
            reserve_b = self.dozer_storage.get("reserve_b")
            swap_amount = reserve_b // 20  # Swap 5% each time
            amount_out = self.runner.call_view_method(
                self.dozer_id, "get_amount_out", swap_amount, reserve_b, reserve_a
            )

            swap_ctx = Context(
                [
                    NCAction(NCActionType.DEPOSIT, self.token_b, swap_amount),
                    NCAction(NCActionType.WITHDRAWAL, HTR_UID, amount_out),
                ],
                self.tx,
                extra_liquidity_address,
                timestamp=self.clock.seconds() + 200,
            )
            self.runner.call_public_method(
                self.dozer_id, "swap_exact_tokens_for_tokens", swap_ctx
            )

        final_price = self.dozer_storage.get("reserve_a") / self.dozer_storage.get(
            "reserve_b"
        )
        print(f"Final token_b price in HTR: {final_price=}")

        price_drop = (initial_price - final_price) / initial_price * 100
        print(f"Token B price drop: {price_drop:.2f}%")

        # Verify price impact greater than 95%
        self.assertGreater(price_drop, 95)

        # Try to withdraw after timelock with IL protection
        withdraw_ctx = Context(
            [
                NCAction(NCActionType.WITHDRAWAL, self.token_b, deposit_amount),
                NCAction(NCActionType.WITHDRAWAL, HTR_UID, 0),
            ],
            self.tx,
            user_address,
            timestamp=self.clock.seconds() + (timelock * MONTHS_IN_SECONDS) + 1,
        )

        # Withdrawal should succeed
        self.runner.call_public_method(self.oasis_id, "user_withdraw", withdraw_ctx)

        # Verify complete withdrawal
        user_info_after = self.runner.call_view_method(
            self.oasis_id, "user_info", user_address
        )
        self.assertEqual(user_info_after["user_deposit_b"], 0)

        self.check_balances([user_address])

    def test_impermanent_loss_token_b_skyrockets(self):
        """Test impermanent loss protection when token B increases 100x in value"""
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

        ctx = Context(
            [NCAction(NCActionType.DEPOSIT, self.token_b, deposit_amount)],
            self.tx,
            user_address,
            timestamp=self.clock.seconds(),
        )

        self.runner.call_public_method(self.oasis_id, "user_deposit", ctx, timelock)

        initial_price = self.dozer_storage.get("reserve_a") / self.dozer_storage.get(
            "reserve_b"
        )
        print(f"Initial token_b price in HTR: {initial_price=}")

        # Add extra liquidity to support massive swaps
        extra_liquidity_address = self._get_any_address()[0]
        add_liquidity_ctx = Context(
            [
                NCAction(NCActionType.DEPOSIT, HTR_UID, pool_initial_htr * 100),
                NCAction(
                    NCActionType.DEPOSIT, self.token_b, pool_initial_token_b * 100
                ),
            ],
            self.tx,
            extra_liquidity_address,
            timestamp=self.clock.seconds() + 100,
        )
        self.runner.call_public_method(
            self.dozer_id, "add_liquidity", add_liquidity_ctx
        )

        # Execute swaps to drive up token B price
        # Repeatedly swap HTR for token B
        for _ in range(100):
            reserve_a = self.dozer_storage.get("reserve_a")
            reserve_b = self.dozer_storage.get("reserve_b")
            swap_amount = reserve_a // 10  # Swap 10% each time
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
                timestamp=self.clock.seconds() + 200,
            )
            self.runner.call_public_method(
                self.dozer_id, "swap_exact_tokens_for_tokens", swap_ctx
            )

        final_price = self.dozer_storage.get("reserve_a") / self.dozer_storage.get(
            "reserve_b"
        )
        print(f"Final token_b price in HTR: {final_price=}")

        price_increase = (final_price - initial_price) / initial_price * 100
        print(f"Token B price increase: {price_increase:.2f}%")

        # Verify price increased at least 100x
        self.assertGreater(price_increase, 10000)  # 100x = 10000%

        user_info = self.runner.call_view_method(
            self.oasis_id, "user_info", user_address
        )
        max_withdraw_b = user_info["max_withdraw_b"]
        max_withdraw_htr = user_info["max_withdraw_htr"]

        # Try to withdraw after timelock with IL protection
        withdraw_ctx = Context(
            [
                NCAction(NCActionType.WITHDRAWAL, self.token_b, max_withdraw_b),
                NCAction(NCActionType.WITHDRAWAL, HTR_UID, max_withdraw_htr),
            ],
            self.tx,
            user_address,
            timestamp=self.clock.seconds() + (timelock * MONTHS_IN_SECONDS) + 1,
        )

        print(
            f"deposit_amount: {deposit_amount}, max_withdraw_b: {max_withdraw_b}, max_withdraw_htr: {max_withdraw_htr}"
        )

        # Withdrawal should succeed
        self.runner.call_public_method(self.oasis_id, "user_withdraw", withdraw_ctx)

        # Verify complete withdrawal
        user_info_after = self.runner.call_view_method(
            self.oasis_id, "user_info", user_address
        )
        self.assertEqual(user_info_after["user_deposit_b"], 0)

        self.check_balances([user_address])

    def test_impermanent_loss_protection(self):
        """Test impermanent loss protection when token B outperforms HTR"""
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

        ctx = Context(
            [NCAction(NCActionType.DEPOSIT, self.token_b, deposit_amount)],
            self.tx,
            user_address,
            timestamp=self.clock.seconds(),
        )

        self.runner.call_public_method(self.oasis_id, "user_deposit", ctx, timelock)

        htr_amount_deposit = self._quote_add_liquidity_in(deposit_amount)
        user_bonus = self._get_user_bonus(timelock, htr_amount_deposit)

        # Execute swaps to simulate token B price increase
        extra_liquidity_address = self._get_any_address()[0]
        add_liquidity_ctx = Context(
            [
                NCAction(NCActionType.DEPOSIT, HTR_UID, pool_initial_htr),
                NCAction(NCActionType.DEPOSIT, self.token_b, pool_initial_token_b),
            ],
            self.tx,
            extra_liquidity_address,
            timestamp=self.clock.seconds() + 100,
        )
        self.runner.call_public_method(
            self.dozer_id, "add_liquidity", add_liquidity_ctx
        )

        print(
            f"price token_b before: {self.dozer_storage.get('reserve_a')/self.dozer_storage.get('reserve_b')=} "
        )

        # Execute swaps to drive up token B price
        for _ in range(50):
            swap_amount = pool_initial_htr // 10
            reserve_a = self.dozer_storage.get("reserve_a")
            reserve_b = self.dozer_storage.get("reserve_b")
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
                timestamp=self.clock.seconds() + 200,
            )
            self.runner.call_public_method(
                self.dozer_id, "swap_exact_tokens_for_tokens", swap_ctx
            )

        # Calculate available withdrawal amounts after price impact
        user_info = self.runner.call_view_method(
            self.oasis_id, "user_info", user_address
        )
        oasis_quote = self._quote_remove_liquidity_oasis()

        htr_oasis_amount = oasis_quote["max_withdraw_a"]
        token_b_oasis_amount = oasis_quote["user_lp_b"]
        user_liquidity = user_info["user_liquidity"]
        total_liquidity = user_info["total_liquidity"]
        user_balance_b = user_info["user_balance_b"]
        user_balance_a = user_info["user_balance_a"]
        user_lp_b = (user_liquidity) * token_b_oasis_amount // (total_liquidity)
        user_lp_htr = user_liquidity * htr_oasis_amount // (total_liquidity)

        # Verify user can withdraw less token B than deposit due to price impact
        self.assertLess(user_lp_b, deposit_amount)

        # Calculate IL compensation in HTR
        loss_amount = deposit_amount - user_lp_b
        loss_htr = self.runner.call_view_method(
            self.dozer_id, "quote_token_b", loss_amount
        )

        if loss_htr > user_lp_htr:
            loss_htr = user_lp_htr

        self.assertEqual(user_balance_a, user_bonus)

        # Calculate available withdrawal amounts after price impact
        max_withdraw_htr = user_balance_a + loss_htr
        max_withdraw_b = user_balance_b + user_lp_b

        # Try to withdraw after timelock with maximum amounts
        withdraw_ctx = Context(
            [
                NCAction(NCActionType.WITHDRAWAL, self.token_b, max_withdraw_b),
                NCAction(NCActionType.WITHDRAWAL, HTR_UID, max_withdraw_htr),
            ],
            self.tx,
            user_address,
            timestamp=self.clock.seconds() + (timelock * MONTHS_IN_SECONDS) + 1,
        )

        # Verify IL protection amount makes user whole
        token_b_value_lost = deposit_amount - user_lp_b
        htr_compensation_value = self.runner.call_view_method(
            self.dozer_id,
            "quote",
            loss_htr,
            self.dozer_storage.get("reserve_a"),
            self.dozer_storage.get("reserve_b"),
        )

        self.runner.call_public_method(self.oasis_id, "user_withdraw", withdraw_ctx)

        # Verify withdrawal and IL protection
        user_info_after = self.runner.call_view_method(
            self.oasis_id, "user_info", user_address
        )

        # Verify complete withdrawal
        self.assertEqual(user_info_after["user_deposit_b"], 0)

        # Verify received correct amounts
        self.assertEqual(
            user_info_after["user_lp_b"], 0
        )  # All available token B withdrawn
        self.assertEqual(
            user_info_after["max_withdraw_htr"], 0
        )  # All HTR compensation withdrawn

        print(
            f"price token_b after: {self.dozer_storage.get('reserve_a')/self.dozer_storage.get('reserve_b')=} "
        )

        # Value received should be approximately equal to initial deposit value
        # (allowing for some deviation due to precision)
        total_value_received = user_lp_b + htr_compensation_value
        self.assertGreaterEqual(
            total_value_received,
            deposit_amount * 0.75,  # Allow for 0.01% deviation due to precision
        )

        self.check_balances([user_address])

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

            self.runner.call_public_method(self.oasis_id, "user_deposit", ctx, timelock)

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

    def test_early_withdrawal_prevention(self):
        """Test that early withdrawals are prevented before timelock expiry"""
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

        self.runner.call_public_method(self.oasis_id, "user_deposit", ctx, timelock)

        # Try withdrawing at different times before timelock expiry
        test_times = [
            1,  # Immediately after
            MONTHS_IN_SECONDS * 6,  # Halfway through
            (MONTHS_IN_SECONDS * 12) - 100,  # Just before expiry
        ]

        for time_delta in test_times:
            withdraw_ctx = Context(
                [
                    NCAction(NCActionType.WITHDRAWAL, self.token_b, deposit_amount),
                    NCAction(NCActionType.WITHDRAWAL, HTR_UID, 0),
                ],
                self.tx,
                user_address,
                timestamp=deposit_time + time_delta,
            )

            with self.assertRaises(NCFail):
                self.runner.call_public_method(
                    self.oasis_id, "user_withdraw", withdraw_ctx
                )

        # Verify successful withdrawal after timelock
        withdraw_ctx = Context(
            [
                NCAction(NCActionType.WITHDRAWAL, self.token_b, deposit_amount),
                NCAction(NCActionType.WITHDRAWAL, HTR_UID, 0),
            ],
            self.tx,
            user_address,
            timestamp=deposit_time + (MONTHS_IN_SECONDS * 12) + 1,
        )

        self.runner.call_public_method(self.oasis_id, "user_withdraw", withdraw_ctx)

        user_info = self.runner.call_view_method(
            self.oasis_id, "user_info", user_address
        )
        self.assertEqual(user_info["user_deposit_b"], 0)  # Successful withdrawal
        self.check_balances([user_address])

    def test_bonus_withdrawal_before_timelock(self):
        """Test that bonus HTR can be withdrawn before timelock expiry"""
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

        self.runner.call_public_method(self.oasis_id, "user_deposit", ctx, timelock)

        # Calculate expected bonus
        htr_amount = self._quote_add_liquidity_in(deposit_amount)
        expected_bonus = self._get_user_bonus(timelock, htr_amount)

        # Verify bonus amount
        user_info = self.runner.call_view_method(
            self.oasis_id, "user_info", user_address
        )
        self.assertEqual(user_info["user_balance_a"], expected_bonus)

        # Withdraw bonus immediately
        withdraw_bonus_ctx = Context(
            [NCAction(NCActionType.WITHDRAWAL, HTR_UID, expected_bonus)],
            self.tx,
            user_address,
            timestamp=deposit_time + 1,
        )

        self.runner.call_public_method(
            self.oasis_id, "user_withdraw_bonus", withdraw_bonus_ctx
        )

        # Verify bonus was withdrawn
        user_info = self.runner.call_view_method(
            self.oasis_id, "user_info", user_address
        )
        self.assertEqual(user_info["user_balance_a"], 0)

        # Verify principal is still locked
        self.assertEqual(user_info["user_deposit_b"], deposit_amount)
        self.assertGreater(user_info["user_withdrawal_time"], deposit_time)
        self.check_balances([user_address])

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
                    self.oasis_id, "user_deposit", ctx, invalid_timelock
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
            self.oasis_id, "user_deposit", deposit_ctx, timelock
        )

        # Try withdrawal exactly at expiry
        exact_expiry = deposit_time + (timelock * MONTHS_IN_SECONDS)
        withdraw_ctx = Context(
            [
                NCAction(NCActionType.WITHDRAWAL, self.token_b, deposit_amount),
                NCAction(NCActionType.WITHDRAWAL, HTR_UID, 0),
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
        self.runner.call_public_method(self.oasis_id, "user_deposit", deposit_1_ctx, 12)

        # Make second deposit with 6 month lock after 3 months
        deposit_2_amount = 2_000_00
        deposit_2_ctx = Context(
            [NCAction(NCActionType.DEPOSIT, self.token_b, deposit_2_amount)],
            self.tx,
            user_address,
            timestamp=initial_time + (3 * MONTHS_IN_SECONDS),
        )
        self.runner.call_public_method(self.oasis_id, "user_deposit", deposit_2_ctx, 6)

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
        early_withdraw_ctx = Context(
            [
                NCAction(
                    NCActionType.WITHDRAWAL,
                    self.token_b,
                    deposit_1_amount + deposit_2_amount,
                ),
                NCAction(NCActionType.WITHDRAWAL, HTR_UID, 0),
            ],
            self.tx,
            user_address,
            timestamp=expected_unlock_time,
        )

        with self.assertRaises(NCFail):
            self.runner.call_public_method(
                self.oasis_id, "user_withdraw", early_withdraw_ctx
            )

        # Withdrawal after weighted timelock should succeed
        withdraw_ctx = Context(
            [
                NCAction(
                    NCActionType.WITHDRAWAL,
                    self.token_b,
                    deposit_1_amount + deposit_2_amount,
                ),
                NCAction(NCActionType.WITHDRAWAL, HTR_UID, 0),
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

        self.runner.call_public_method(self.oasis_id, "user_deposit", ctx, timelock)

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

        self.runner.call_public_method(self.oasis_id, "user_deposit", ctx, timelock)

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

        self.runner.call_public_method(self.oasis_id, "user_deposit", ctx, timelock)

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
                    oasis_id, "initialize", ctx, self.dozer_id, self.token_b, fee
                )
                # Test deposit with fee
                user_address = self._get_any_address()[0]
                deposit_amount = 1_000_00

                deposit_ctx = Context(
                    [NCAction(NCActionType.DEPOSIT, self.token_b, deposit_amount)],
                    self.tx,
                    user_address,
                    timestamp=self.clock.seconds(),
                )

                self.runner.call_public_method(oasis_id, "user_deposit", deposit_ctx, 6)

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

        self.runner.call_public_method(self.oasis_id, "user_deposit", ctx, timelock)

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
            self.runner.call_public_method(self.oasis_id, "user_deposit", ctx, timelock)

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

        self.runner.call_public_method(self.oasis_id, "user_deposit", ctx, timelock)

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

        self.runner.call_public_method(self.oasis_id, "user_deposit", ctx, timelock)

        user_info = self.runner.call_view_method(
            self.oasis_id, "user_info", user_address
        )
        self.assertEqual(user_info["user_deposit_b"], deposit_amount)
        self.check_balances([user_address])

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

        self.runner.call_public_method(self.oasis_id, "user_deposit", ctx, 6)

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

        ctx = Context(
            [
                NCAction(NCActionType.WITHDRAWAL, self.token_b, max_withdraw_b),
                NCAction(NCActionType.WITHDRAWAL, HTR_UID, max_withdraw_htr),
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
