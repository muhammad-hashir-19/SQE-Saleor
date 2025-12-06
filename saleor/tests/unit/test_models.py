"""
Unit tests for Saleor models.
Run with: pytest tests/unit/test_models.py -v
"""

import pytest
from decimal import Decimal
from django.core.exceptions import ValidationError


class TestProductModel:
    """Tests for Product model."""
    
    def test_product_creation(self, product):
        """Test that a product can be created."""
        assert product.pk is not None
        assert product.name == "Test Product"
        assert product.price_amount == Decimal("99.99")
        assert product.is_published is True
        assert str(product) == "Test Product"
    
    def test_product_slug_generation(self, product_type, category):
        """Test product slug is generated from name."""
        from saleor.product.models import Product
        
        product = Product.objects.create(
            name="New Test Product",
            product_type=product_type,
            category=category,
            price_amount=50.00,
            currency="USD"
        )
        
        assert product.slug == "new-test-product"
    
    def test_product_price_validation(self, product_type, category):
        """Test product price validation."""
        from saleor.product.models import Product
        
        # Test negative price (should be allowed or handled)
        product = Product.objects.create(
            name="Negative Price Product",
            product_type=product_type,
            category=category,
            price_amount=-10.00,
            currency="USD"
        )
        
        # Depending on your business logic, you might want to assert:
        # assert product.price_amount >= Decimal("0.00")
    
    def test_product_availability(self, product):
        """Test product availability methods."""
        # Test is_available method
        assert hasattr(product, 'is_available')
        
        # Test with publication date
        from django.utils import timezone
        from datetime import timedelta
        
        product.available_on = timezone.now() - timedelta(days=1)
        product.save()
        
        # Should be available since available_on is in past
        assert product.is_available() is True
        
        # Make it unavailable in future
        product.available_on = timezone.now() + timedelta(days=1)
        product.save()
        
        # Should not be available
        assert product.is_available() is False


class TestUserModel:
    """Tests for User model."""
    
    def test_user_creation(self, customer_user):
        """Test user creation."""
        assert customer_user.pk is not None
        assert customer_user.email == "customer@example.com"
        assert customer_user.check_password("password123") is True
        assert customer_user.is_staff is False
        assert customer_user.is_active is True
    
    def test_user_full_name(self, customer_user):
        """Test user's full name."""
        assert customer_user.get_full_name() == "John Doe"
        
        # Test with empty names
        customer_user.first_name = ""
        customer_user.last_name = ""
        assert customer_user.get_full_name() == ""
        
        # Test with only first name
        customer_user.first_name = "John"
        assert customer_user.get_full_name() == "John"
    
    def test_staff_user(self, staff_user):
        """Test staff user properties."""
        assert staff_user.is_staff is True
        assert staff_user.is_superuser is False
    
    def test_admin_user(self, admin_user):
        """Test admin user properties."""
        assert admin_user.is_staff is True
        assert admin_user.is_superuser is True


class TestOrderModel:
    """Tests for Order model."""
    
    def test_order_creation(self, order):
        """Test order creation."""
        assert order.pk is not None
        assert order.user_email == "customer@example.com"
        assert order.currency == "USD"
        assert order.total_net_amount == Decimal("100.00")
        assert order.total_gross_amount == Decimal("118.00")
        assert order.status == "unfulfilled"
    
    def test_order_total_methods(self, order):
        """Test order total calculation methods."""
        # Test get_total method
        total = order.get_total()
        assert total.net == Decimal("100.00")
        assert total.gross == Decimal("118.00")
        
        # Test total tax
        assert total.tax == Decimal("18.00")
    
    def test_order_status_flow(self, order):
        """Test order status transitions."""
        # Initial status
        assert order.status == "unfulfilled"
        
        # Change status
        order.status = "fulfilled"
        order.save()
        
        assert order.status == "fulfilled"
        
        # Test cancel
        order.status = "canceled"
        order.save()
        assert order.status == "canceled"


class TestProductVariantModel:
    """Tests for ProductVariant model."""
    
    def test_variant_creation(self, product_variant):
        """Test variant creation."""
        assert product_variant.pk is not None
        assert product_variant.sku == "TEST001"
        assert product_variant.price_amount == Decimal("99.99")
        assert product_variant.product.name == "Test Product"
    
    def test_variant_price_changes(self, product_variant):
        """Test variant price updates."""
        # Update price
        product_variant.price_amount = Decimal("149.99")
        product_variant.save()
        
        assert product_variant.price_amount == Decimal("149.99")
    
    def test_variant_availability(self, product_variant):
        """Test variant availability."""
        # Check if variant is available
        assert product_variant.is_visible() is True
        
        # Make product unpublished
        product_variant.product.is_published = False
        product_variant.product.save()
        
        # Variant should not be visible
        assert product_variant.is_visible() is False


class TestCheckoutModel:
    """Tests for Checkout model."""
    
    def test_checkout_creation(self, checkout):
        """Test checkout creation."""
        assert checkout.pk is not None
        assert checkout.email == "customer@example.com"
        assert checkout.currency == "USD"
        assert checkout.get_total().gross == Decimal("0.00")  # Empty checkout
    
    def test_checkout_with_lines(self, checkout, product_variant):
        """Test checkout with line items."""
        from saleor.checkout.models import CheckoutLine
        
        # Add line to checkout
        line = CheckoutLine.objects.create(
            checkout=checkout,
            variant=product_variant,
            quantity=2
        )
        
        assert checkout.lines.count() == 1
        assert checkout.quantity == 2
        
        # Calculate total
        total = checkout.get_total()
        expected = product_variant.price_amount * 2
        assert total.gross == expected


class TestVoucherModel:
    """Tests for Voucher model."""
    
    def test_voucher_creation(self, voucher):
        """Test voucher creation."""
        assert voucher.pk is not None
        assert voucher.code == "TEST10"
        assert voucher.discount_value == Decimal("10.00")
        assert voucher.discount_value_type == "percentage"
        assert voucher.type == "entire_order"
        assert voucher.is_active is True
    
    def test_voucher_apply_discount(self, voucher):
        """Test voucher discount application."""
        # Test percentage discount
        amount = Decimal("100.00")
        discount = voucher.get_discount_amount(amount)
        assert discount == Decimal("10.00")  # 10% of 100
        
        # Test fixed discount
        voucher.discount_value_type = "fixed"
        voucher.discount_value = Decimal("5.00")
        voucher.save()
        
        discount = voucher.get_discount_amount(amount)
        assert discount == Decimal("5.00")
    
    def test_voucher_validation(self, voucher):
        """Test voucher validation."""
        # Test valid voucher
        assert voucher.validate_min_spent(Decimal("50.00")) is True
        
        # Test with minimum spent
        voucher.min_spent_amount = Decimal("100.00")
        voucher.save()
        
        assert voucher.validate_min_spent(Decimal("50.00")) is False
        assert voucher.validate_min_spent(Decimal("150.00")) is True


@pytest.mark.django_db
class TestBasicQueries:
    """Test basic database queries."""
    
    def test_create_and_retrieve(self):
        """Test creating and retrieving objects."""
        from saleor.account.models import User
        
        # Create user
        user = User.objects.create(
            email="test@test.com",
            first_name="Test",
            last_name="User"
        )
        
        # Retrieve user
        retrieved = User.objects.get(email="test@test.com")
        assert retrieved == user
        assert retrieved.get_full_name() == "Test User"
    
    def test_update_object(self):
        """Test updating objects."""
        from saleor.product.models import Category
        
        category = Category.objects.create(
            name="Original",
            slug="original"
        )
        
        # Update
        category.name = "Updated"
        category.save()
        
        # Verify
        updated = Category.objects.get(slug="original")
        assert updated.name == "Updated"
    
    def test_delete_object(self):
        """Test deleting objects."""
        from saleor.product.models import Category
        
        category = Category.objects.create(
            name="To Delete",
            slug="to-delete"
        )
        
        count_before = Category.objects.count()
        
        # Delete
        category.delete()
        
        count_after = Category.objects.count()
        assert count_after == count_before - 1
        
        # Verify it's gone
        with pytest.raises(Category.DoesNotExist):
            Category.objects.get(slug="to-delete")