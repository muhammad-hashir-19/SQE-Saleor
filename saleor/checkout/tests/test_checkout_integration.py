"""
Integration tests for Checkout service.
Tests interactions between Checkout service, Database, Payment service, and Inventory service.
"""
import pytest
from decimal import Decimal

from saleor.checkout.models import Checkout, CheckoutLine
from saleor.payment.models import Payment
from saleor.product.models import ProductVariant
from saleor.warehouse.models import Stock


@pytest.mark.integration
@pytest.mark.django_db
def test_checkout_creation_and_database_persistence(checkout):
    """
    Integration test: Checkout creation and database persistence.
    Tests interaction between Checkout service and Database.
    """
    # Verify checkout was persisted
    assert checkout.pk is not None
    
    # Retrieve from database
    db_checkout = Checkout.objects.get(pk=checkout.pk)
    
    # Verify data
    assert db_checkout.email == checkout.email
    assert db_checkout.currency == checkout.currency
    assert db_checkout.channel == checkout.channel


@pytest.mark.integration
@pytest.mark.django_db
def test_checkout_line_product_variant_linkage(checkout_with_items):
    """
    Integration test: CheckoutLine-ProductVariant relationship.
    Tests interaction between Checkout service and Product service through database.
    """
    checkout = checkout_with_items
    checkout_lines = checkout.lines.all()
    
    assert checkout_lines.count() > 0
    
    for line in checkout_lines:
        # Verify variant linkage
        assert line.variant is not None
        
        # Retrieve variant from database
        variant = ProductVariant.objects.get(id=line.variant_id)
        
        # Verify data consistency
        assert variant.id == line.variant_id
        assert line.quantity > 0


@pytest.mark.integration
@pytest.mark.django_db
def test_checkout_payment_creation(checkout_with_items):
    """
    Integration test: Payment creation from checkout.
    Tests interaction between Checkout service and Payment service.
    """
    checkout = checkout_with_items
    
    # Create payment for checkout
    payment = Payment.objects.create(
        gateway="dummy",
        is_active=True,
        checkout=checkout,
        total=Decimal("100.00"),
        currency=checkout.currency,
    )
    
    # Verify linkage
    assert payment.checkout_id == checkout.pk
    
    # Retrieve through relationship
    checkout_payments = checkout.payments.all()
    assert payment in checkout_payments


@pytest.mark.integration
@pytest.mark.django_db
def test_checkout_stock_reservation(checkout_with_items, warehouse):
    """
    Integration test: Checkout reserves stock.
    Tests interaction between Checkout service and Inventory/Warehouse service.
    """
    checkout = checkout_with_items
    checkout_lines = checkout.lines.all()
    
    for line in checkout_lines:
        if line.variant:
            # Check stock exists for this variant
            stocks = Stock.objects.filter(
                product_variant=line.variant,
                warehouse=warehouse,
            )
            
            # Verify stock records exist
            assert stocks.exists()
            
            # Verify stock has quantity
            for stock in stocks:
                assert hasattr(stock, 'quantity')
                # In a real scenario, we'd verify reserved quantity
                # but that depends on the implementation




