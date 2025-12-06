"""
Payment gateway tests for SQE-Saleor.
Run with: pytest tests/unit/test_payment.py -v
"""

import pytest
from decimal import Decimal
from unittest.mock import Mock, patch, MagicMock


class TestStripePayment:
    """Tests for Stripe payment gateway."""
    
    def test_stripe_payment_intent_creation(self, mock_stripe):
        """Test creating a Stripe payment intent."""
        from saleor.payment.gateways.stripe import create_payment_intent
        
        # Mock amount
        amount = Decimal("100.00")
        currency = "USD"
        
        # Call function
        result = create_payment_intent(amount, currency)
        
        # Verify Stripe was called
        mock_stripe.assert_called_once()
        
        # Check result
        assert result["id"] == "pi_test_123"
        assert result["client_secret"] == "secret_123"
    
    def test_stripe_webhook_verification(self):
        """Test Stripe webhook signature verification."""
        from saleor.payment.gateways.stripe import verify_webhook_signature
        
        payload = '{"test": "data"}'
        signature = "test_signature"
        
        with patch('stripe.Webhook.construct_event') as mock_verify:
            mock_verify.return_value = {"type": "payment_intent.succeeded"}
            
            event = verify_webhook_signature(payload, signature, "webhook_secret")
            
            assert event["type"] == "payment_intent.succeeded"
    
    def test_stripe_payment_capture(self):
        """Test capturing a Stripe payment."""
        from saleor.payment.gateways.stripe import capture_payment
        
        payment_id = "pi_123"
        amount = Decimal("100.00")
        
        with patch('stripe.PaymentIntent.capture') as mock_capture:
            mock_capture.return_value = Mock(status="succeeded")
            
            result = capture_payment(payment_id, amount)
            
            assert result["status"] == "succeeded"
    
    def test_stripe_refund(self):
        """Test refunding a Stripe payment."""
        from saleor.payment.gateways.stripe import create_refund
        
        payment_intent_id = "pi_123"
        amount = Decimal("50.00")
        
        with patch('stripe.Refund.create') as mock_refund:
            mock_refund.return_value = Mock(status="succeeded", id="re_123")
            
            result = create_refund(payment_intent_id, amount)
            
            assert result["status"] == "succeeded"
            assert result["id"] == "re_123"


class TestPaymentCalculations:
    """Tests for payment calculations."""
    
    def test_calculate_payment_amount(self):
        """Test payment amount calculations."""
        from saleor.payment.utils import calculate_payment_amount
        
        # Test with tax included
        subtotal = Decimal("100.00")
        tax_rate = Decimal("0.18")  # 18%
        shipping = Decimal("10.00")
        
        total = calculate_payment_amount(subtotal, tax_rate, shipping)
        
        # Calculation: 100 + (100 * 0.18) + 10 = 128.00
        expected = Decimal("128.00")
        assert total == expected
    
    def test_currency_conversion(self):
        """Test currency conversion logic."""
        from saleor.payment.utils import convert_currency
        
        amount = Decimal("100.00")
        from_currency = "USD"
        to_currency = "EUR"
        rate = Decimal("0.85")
        
        converted = convert_currency(amount, from_currency, to_currency, rate)
        
        expected = Decimal("85.00")  # 100 * 0.85
        assert converted == expected


@pytest.mark.skip(reason="Requires Razorpay API keys")
class TestRazorpayPayment:
    """Tests for Razorpay payment gateway."""
    
    def test_razorpay_order_creation(self):
        """Test creating a Razorpay order."""
        # This depends on your Razorpay implementation
        pass


class TestPaymentModel:
    """Tests for Payment model."""
    
    def test_payment_status_transitions(self, payment):
        """Test payment status changes."""
        # Initial status
        assert payment.charge_status == "charged"
        
        # Change status
        payment.charge_status = "refunded"
        payment.save()
        
        assert payment.charge_status == "refunded"
        
        # Test capture
        payment.capture(Decimal("100.00"))
        # Check if appropriate methods were called
    
    def test_payment_gateway_data(self, payment):
        """Test payment gateway data storage."""
        # Add gateway-specific data
        payment.extra_data = {
            "payment_intent_id": "pi_123",
            "client_secret": "secret_123",
            "status": "succeeded"
        }
        payment.save()
        
        # Retrieve and verify
        payment.refresh_from_db()
        assert payment.extra_data["payment_intent_id"] == "pi_123"
        assert payment.extra_data["status"] == "succeeded"
    
    def test_payment_total(self, payment):
        """Test payment total amount."""
        assert payment.total == Decimal("118.00")
        
        # Change total
        payment.total = Decimal("200.00")
        payment.save()
        
        assert payment.total == Decimal("200.00")


class TestPaymentErrors:
    """Tests for payment error handling."""
    
    def test_payment_validation(self):
        """Test payment validation."""
        from saleor.payment.models import Payment
        from django.core.exceptions import ValidationError
        
        payment = Payment(
            gateway="stripe",
            total=Decimal("-10.00"),  # Negative amount
            currency="USD"
        )
        
        # Should raise validation error for negative amount
        with pytest.raises(ValidationError):
            payment.full_clean()
    
    def test_invalid_currency(self):
        """Test payment with invalid currency."""
        from saleor.payment.models import Payment
        from django.core.exceptions import ValidationError
        
        payment = Payment(
            gateway="stripe",
            total=Decimal("100.00"),
            currency="INVALID"  # Invalid currency code
        )
        
        # Should raise validation error
        with pytest.raises(ValidationError):
            payment.full_clean()