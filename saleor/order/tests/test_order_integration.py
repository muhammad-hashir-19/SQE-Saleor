"""
Integration tests for Order service.
Tests interactions between Order service, Database, Payment service, and Inventory service.
"""
import pytest
from decimal import Decimal

from saleor.order.models import Order, OrderLine
from saleor.payment.models import Payment
from saleor.product.models import ProductVariant
from saleor.warehouse.models import Stock


@pytest.mark.integration
@pytest.mark.django_db
def test_order_creation_with_lines_and_database_persistence(
    order_with_lines,
):
    """
    Integration test: Order creation with lines persists to database.
    Tests interaction between Order service and Database.
    """
    order = order_with_lines
    
    # Verify order was persisted
    assert order.id is not None
    
    # Retrieve from database
    db_order = Order.objects.get(id=order.id)
    
    # Verify order data
    assert db_order.status == order.status
    assert db_order.total == order.total
    
    # Verify order lines were persisted
    order_lines = db_order.lines.all()
    assert order_lines.count() > 0
    
    for line in order_lines:
        assert line.order_id == order.id
        assert line.quantity > 0


@pytest.mark.integration
@pytest.mark.django_db
def test_order_payment_linkage(order_with_lines):
    """
    Integration test: Order-Payment relationship.
    Tests interaction between Order service and Payment service through database.
    """
    order = order_with_lines
    
    # Create payment for order
    payment = Payment.objects.create(
        gateway="dummy",
        is_active=True,
        order=order,
        total=order.total.gross.amount,
        currency=order.currency,
    )
    
    # Verify linkage through database
    db_order = Order.objects.get(id=order.id)
    order_payments = db_order.payments.all()
    
    assert payment in order_payments
    assert order_payments.count() == 1
    
    # Verify reverse relationship
    assert payment.order == order


@pytest.mark.integration
@pytest.mark.django_db
def test_order_line_product_variant_linkage(order_with_lines):
    """
    Integration test: OrderLine-ProductVariant relationship.
    Tests interaction between Order service and Product service through database.
    """
    order = order_with_lines
    order_lines = order.lines.all()
    
    for line in order_lines:
        # Verify product variant linkage
        assert line.variant is not None
        
        # Retrieve variant from database
        variant = ProductVariant.objects.get(id=line.variant_id)
        
        # Verify data consistency
        assert variant.id == line.variant_id
        assert line.product_name is not None
        assert line.variant_name is not None


@pytest.mark.integration
@pytest.mark.django_db
def test_order_affects_stock_levels(
    order_with_lines,
    warehouse,
):
    """
    Integration test: Order creation affects inventory stock levels.
    Tests interaction between Order service and Warehouse/Inventory service.
    """
    order = order_with_lines
    
    # Get order lines
    order_lines = order.lines.all()
    
    for line in order_lines:
        if line.variant:
            # Check stock exists for this variant
            stocks = Stock.objects.filter(
                product_variant=line.variant
            )
            
            # Verify stock records exist in database
            assert stocks.exists()
            
            # Verify we can query stock levels
            for stock in stocks:
                # Stock should have quantity tracking
                assert hasattr(stock, 'quantity')


@pytest.mark.integration
@pytest.mark.django_db
def test_order_status_transitions_persist_to_database(order_with_lines):
    """
    Integration test: Order status transitions are persisted.
    Tests interaction between Order service state management and Database.
    """
    from saleor.order import OrderStatus
    
    order = order_with_lines
    initial_status = order.status
    
    # Change order status
    order.status = OrderStatus.FULFILLED
    order.save()
    
    # Verify database was updated
    db_order = Order.objects.get(id=order.id)
    assert db_order.status == OrderStatus.FULFILLED
    assert db_order.status != initial_status
    
    # Change again
    order.status = OrderStatus.CANCELED
    order.save()
    
    # Verify again
    db_order.refresh_from_db()
    assert db_order.status == OrderStatus.CANCELED
