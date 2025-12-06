import pytest
from django.contrib.auth import get_user_model
from saleor.warehouse.models import Warehouse

User = get_user_model()

@pytest.fixture
def user(db):
    return User.objects.create_user(
        email="user@test.com",
        password="test1234",
        is_staff=True
    )

@pytest.fixture
def superuser(db):
    return User.objects.create_superuser(
        email="admin@test.com",
        password="admin123"
    )

@pytest.fixture
def warehouse(db):
    return Warehouse.objects.create(
        name="Main Warehouse",
        slug="main-warehouse"
    )
"""
Pytest configuration for SQE-Saleor tests.
"""

import pytest
import django
from django.conf import settings
import os
import sys

# Setup Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "saleor.settings")
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

django.setup()

# Configure test database
settings.DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# Disable password hashing for faster tests
settings.PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

# Disable email sending
settings.EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'

# ==================== FIXTURES ====================

@pytest.fixture
def admin_user(db):
    """Create an admin user for testing."""
    from saleor.account.models import User
    return User.objects.create_superuser(
        email="admin@example.com",
        password="password123"
    )

@pytest.fixture
def staff_user(db):
    """Create a staff user for testing."""
    from saleor.account.models import User
    user = User.objects.create_user(
        email="staff@example.com",
        password="password123"
    )
    user.is_staff = True
    user.save()
    return user

@pytest.fixture
def customer_user(db):
    """Create a regular customer user."""
    from saleor.account.models import User
    return User.objects.create_user(
        email="customer@example.com",
        password="password123",
        first_name="John",
        last_name="Doe"
    )

@pytest.fixture
def product_type(db):
    """Create a product type."""
    from saleor.product.models import ProductType
    return ProductType.objects.create(
        name="Test Type",
        slug="test-type"
    )

@pytest.fixture
def category(db):
    """Create a category."""
    from saleor.product.models import Category
    return Category.objects.create(
        name="Test Category",
        slug="test-category"
    )

@pytest.fixture
def product(db, product_type, category):
    """Create a product."""
    from saleor.product.models import Product
    return Product.objects.create(
        name="Test Product",
        slug="test-product",
        product_type=product_type,
        category=category,
        price_amount=99.99,
        currency="USD",
        is_published=True
    )

@pytest.fixture
def product_variant(db, product):
    """Create a product variant."""
    from saleor.product.models import ProductVariant
    return ProductVariant.objects.create(
        product=product,
        sku="TEST001",
        name="Test Variant",
        price_amount=99.99,
        currency="USD"
    )

@pytest.fixture
def order(db, customer_user):
    """Create an order."""
    from saleor.order.models import Order
    from saleor.account.models import Address
    
    billing_address = Address.objects.create(
        first_name="John",
        last_name="Doe",
        street_address_1="123 Main St",
        city="New York",
        country="US"
    )
    
    return Order.objects.create(
        user=customer_user,
        billing_address=billing_address,
        shipping_address=billing_address,
        user_email=customer_user.email,
        currency="USD",
        total_net_amount=100.00,
        total_gross_amount=118.00
    )

@pytest.fixture
def checkout(db, customer_user):
    """Create a checkout."""
    from saleor.checkout.models import Checkout
    return Checkout.objects.create(
        user=customer_user,
        email=customer_user.email,
        currency="USD"
    )

@pytest.fixture
def voucher(db):
    """Create a voucher."""
    from saleor.discount.models import Voucher
    return Voucher.objects.create(
        code="TEST10",
        discount_value_type="percentage",
        discount_value=10.00,
        type="entire_order"
    )

@pytest.fixture
def mock_stripe():
    """Mock Stripe API."""
    from unittest.mock import Mock, patch
    
    with patch('stripe.PaymentIntent.create') as mock_create:
        mock_create.return_value = Mock(
            id="pi_test_123",
            client_secret="secret_123",
            status="succeeded"
        )
        yield mock_create

@pytest.fixture(autouse=True)
def enable_db_access_for_all_tests(db):
    """Enable database access for all tests."""
    pass