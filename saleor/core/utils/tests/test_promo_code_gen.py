
from unittest.mock import MagicMock, patch

import pytest
from django.core.exceptions import ValidationError

from saleor.core.utils.promo_code import (
    InvalidPromoCode,
    generate_promo_code,
    generate_random_code,
    is_available_promo_code,
    promo_code_is_gift_card,
    promo_code_is_voucher,
)
from saleor.giftcard.error_codes import GiftCardErrorCode

@pytest.fixture
def mock_voucher_objects():
    with patch("saleor.core.utils.promo_code.VoucherCode.objects") as mock_objects:
        yield mock_objects

@pytest.fixture
def mock_gift_card_objects():
    with patch("saleor.core.utils.promo_code.GiftCard.objects") as mock_objects:
        yield mock_objects

class TestPromoCodeGenerators:
    def test_generate_random_code_format(self):
        """Test that generated code follows ABCD-EFGH-IJKL format."""
        code = generate_random_code()
        assert len(code) == 14  # 12 chars + 2 dashes
        assert code.count("-") == 2
        parts = code.split("-")
        assert len(parts) == 3
        for part in parts:
            assert len(part) == 4
            assert part.isalnum()
            assert part.isupper()

    @patch("saleor.core.utils.promo_code.is_available_promo_code")
    @patch("saleor.core.utils.promo_code.generate_random_code")
    def test_generate_promo_code_success_first_try(self, mock_gen, mock_is_available):
        """Test generating a promo code when the first one is available."""
        mock_gen.return_value = "AAAA-BBBB-CCCC"
        mock_is_available.return_value = True

        code = generate_promo_code()

        assert code == "AAAA-BBBB-CCCC"
        mock_gen.assert_called_once()
        mock_is_available.assert_called_once_with("AAAA-BBBB-CCCC")

    @patch("saleor.core.utils.promo_code.is_available_promo_code")
    @patch("saleor.core.utils.promo_code.generate_random_code")
    def test_generate_promo_code_collision_retry(self, mock_gen, mock_is_available):
        """Test that it retries if the generated code is not available."""
        # First return value is "taken", second is "free"
        mock_gen.side_effect = ["TAKEN-CODE-1234", "VALID-CODE-5678"]
        mock_is_available.side_effect = [False, True]

        code = generate_promo_code()

        assert code == "VALID-CODE-5678"
        assert mock_gen.call_count == 2
        assert mock_is_available.call_count == 2
        mock_is_available.assert_any_call("TAKEN-CODE-1234")
        mock_is_available.assert_any_call("VALID-CODE-5678")


class TestPromoCodeAvailability:
    def test_promo_code_is_voucher_exists(self, mock_voucher_objects):
        """Test promo_code_is_voucher returns True if code exists in Vouchers."""
        mock_voucher_objects.filter.return_value.exists.return_value = True
        assert promo_code_is_voucher("TEST-CODE") is True
        mock_voucher_objects.filter.assert_called_with(code="TEST-CODE")

    def test_promo_code_is_voucher_not_exists(self, mock_voucher_objects):
        """Test promo_code_is_voucher returns False if code does not exist."""
        mock_voucher_objects.filter.return_value.exists.return_value = False
        assert promo_code_is_voucher("TEST-CODE") is False

    def test_promo_code_is_gift_card_exists(self, mock_gift_card_objects):
        """Test promo_code_is_gift_card returns True if code exists in GiftCards."""
        mock_gift_card_objects.filter.return_value.exists.return_value = True
        assert promo_code_is_gift_card("TEST-CODE") is True
        mock_gift_card_objects.filter.assert_called_with(code="TEST-CODE")

    def test_promo_code_is_gift_card_not_exists(self, mock_gift_card_objects):
        """Test promo_code_is_gift_card returns False if code does not exist."""
        mock_gift_card_objects.filter.return_value.exists.return_value = False
        assert promo_code_is_gift_card("TEST-CODE") is False

    @patch("saleor.core.utils.promo_code.promo_code_is_voucher")
    @patch("saleor.core.utils.promo_code.promo_code_is_gift_card")
    def test_is_available_promo_code_available(self, mock_is_gc, mock_is_voucher):
        """Test available if neither voucher nor gift card."""
        mock_is_gc.return_value = False
        mock_is_voucher.return_value = False
        assert is_available_promo_code("FREE-CODE") is True

    @patch("saleor.core.utils.promo_code.promo_code_is_voucher")
    @patch("saleor.core.utils.promo_code.promo_code_is_gift_card")
    def test_is_available_promo_code_taken_by_voucher(self, mock_is_gc, mock_is_voucher):
        """Test unavailable if it is a voucher."""
        mock_is_gc.return_value = False
        mock_is_voucher.return_value = True
        assert is_available_promo_code("TAKEN-CODE") is False

    @patch("saleor.core.utils.promo_code.promo_code_is_voucher")
    @patch("saleor.core.utils.promo_code.promo_code_is_gift_card")
    def test_is_available_promo_code_taken_by_gift_card(self, mock_is_gc, mock_is_voucher):
        """Test unavailable if it is a gift card."""
        mock_is_gc.return_value = True
        # Note: Short-circuiting might prevent voucher check, but that's fine
        assert is_available_promo_code("TAKEN-CODE") is False


class TestInvalidPromoCodeException:
    def test_exception_default_message(self):
        """Test InvalidPromoCode default error message."""
        exc = InvalidPromoCode()
        assert isinstance(exc, ValidationError)
        assert "promo_code" in exc.message_dict
        assert exc.message_dict["promo_code"][0] == "Promo code is invalid"
        # Validate error code if possible, or just the string

    def test_exception_custom_message(self):
        """Test InvalidPromoCode with custom message."""
        exc = InvalidPromoCode(message="Custom Error")
        assert exc.message == "Custom Error"
