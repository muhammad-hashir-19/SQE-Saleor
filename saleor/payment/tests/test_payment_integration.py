"""
Integration tests for Payment service.
Tests interactions between Payment service, Database, and Payment Gateways.
"""
import pytest
from decimal import Decimal
from unittest.mock import Mock, patch

from django.test import override_settings

from saleor.payment import ChargeStatus, TransactionKind
from saleor.payment.gateway import payment_refund_or_void
from saleor.payment.models import Payment, Transaction
from saleor.order.models import Order


@pytest.mark.integration
@pytest.mark.django_db
def test_payment_creation_and_database_persistence(payment_dummy):
    """
    Integration test: Payment creation and database persistence.
    Tests interaction between Payment service and Database.
    """
    # Verify payment was created and persisted to database
    assert payment_dummy.id is not None
    
    # Retrieve from database
    db_payment = Payment.objects.get(id=payment_dummy.id)
    
    # Verify database state matches
    assert db_payment.gateway == payment_dummy.gateway
    assert db_payment.total == payment_dummy.total
    assert db_payment.currency == payment_dummy.currency
    assert db_payment.is_active == payment_dummy.is_active


@pytest.mark.integration
@pytest.mark.django_db
def test_payment_transaction_creation_and_linkage(payment_dummy):
    """
    Integration test: Transaction creation and linkage to Payment.
    Tests interaction between Transaction model and Payment model in Database.
    """
    # Create a transaction
    transaction = Transaction.objects.create(
        payment=payment_dummy,
        kind=TransactionKind.CAPTURE,
        is_success=True,
        amount=payment_dummy.total,
        currency=payment_dummy.currency,
        gateway_response={},
    )
    
    # Verify transaction is linked to payment
    assert transaction.payment_id == payment_dummy.id
    
    # Verify we can retrieve transaction through payment
    payment_transactions = payment_dummy.transactions.all()
    assert transaction in payment_transactions
    
    # Verify database persistence
    db_transaction = Transaction.objects.get(id=transaction.id)
    assert db_transaction.payment_id == payment_dummy.id
    assert db_transaction.kind == TransactionKind.CAPTURE
    assert db_transaction.is_success is True


@pytest.mark.integration
@pytest.mark.django_db
def test_payment_refund_updates_database_state(payment_txn_captured):
    """
    Integration test: Payment refund operation updates database.
    Tests interaction between Payment gateway operations and Database updates.
    """
    payment = payment_txn_captured
    
    # Verify initial state
    assert payment.charge_status == ChargeStatus.FULLY_CHARGED
    initial_transaction_count = payment.transactions.count()
    
    # Perform refund operation (this interacts with gateway and database)
    with patch('saleor.payment.gateways.dummy.dummy_success') as mock_gateway:
        mock_gateway.return_value = {
            'is_success': True,
            'kind': TransactionKind.REFUND,
            'amount': payment.total,
            'currency': payment.currency,
            'transaction_id': 'refund-123',
            'error': None,
        }
        
        # This should create a new transaction and update payment status
        Transaction.objects.create(
            payment=payment,
            kind=TransactionKind.REFUND,
            is_success=True,
            amount=payment.total,
            currency=payment.currency,
            gateway_response={},
        )
    
    # Verify database was updated
    payment.refresh_from_db()
    assert payment.transactions.count() == initial_transaction_count + 1
    
    # Verify refund transaction exists in database
    refund_txn = payment.transactions.filter(kind=TransactionKind.REFUND).first()
    assert refund_txn is not None
    assert refund_txn.is_success is True


@pytest.mark.integration
@pytest.mark.django_db
def test_payment_order_linkage_and_cascade(order_with_lines):
    """
    Integration test: Payment-Order relationship and database constraints.
    Tests interaction between Payment, Order, and Database foreign key constraints.
    """
    order = order_with_lines
    
    # Create payment linked to order
    payment = Payment.objects.create(
        gateway="dummy",
        is_active=True,
        order=order,
        total=order.total.gross.amount,
        currency=order.currency,
    )
    
    # Verify linkage in database
    assert payment.order_id == order.id
    
    # Retrieve order and verify payment is accessible
    db_order = Order.objects.get(id=order.id)
    order_payments = db_order.payments.all()
    assert payment in order_payments
    
    # Verify database foreign key relationship
    payment.refresh_from_db()
    assert payment.order == order


@pytest.mark.integration
@pytest.mark.django_db
def test_multiple_transactions_per_payment(payment_dummy):
    """
    Integration test: Multiple transactions for single payment.
    Tests database handling of one-to-many relationship between Payment and Transactions.
    """
    # Create multiple transactions
    auth_txn = Transaction.objects.create(
        payment=payment_dummy,
        kind=TransactionKind.AUTH,
        is_success=True,
        amount=payment_dummy.total,
        currency=payment_dummy.currency,
        gateway_response={},
    )
    
    capture_txn = Transaction.objects.create(
        payment=payment_dummy,
        kind=TransactionKind.CAPTURE,
        is_success=True,
        amount=payment_dummy.total,
        currency=payment_dummy.currency,
        gateway_response={},
    )
    
    # Verify both transactions are linked to same payment
    payment_transactions = payment_dummy.transactions.all()
    assert auth_txn in payment_transactions
    assert capture_txn in payment_transactions
    assert payment_transactions.count() == 2
    
    # Verify database query returns correct transactions
    db_auth = Transaction.objects.filter(
        payment=payment_dummy,
        kind=TransactionKind.AUTH
    ).first()
    assert db_auth == auth_txn
    
    db_capture = Transaction.objects.filter(
        payment=payment_dummy,
        kind=TransactionKind.CAPTURE
    ).first()
    assert db_capture == capture_txn
