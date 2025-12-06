"""
Pytest configuration and fixtures for SQE-Saleor.
This file is automatically loaded by pytest before tests run.
"""

import os
import sys
import tempfile
import warnings
from pathlib import Path

import django
import pytest
from django.conf import settings
from django.core.management import call_command
from django.db import connections
from django.test import TestCase
from django.utils import timezone

# Add project root to Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Configure Django settings for tests
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "saleor.settings")

# Initialize Django
django.setup()

# Suppress warnings
warnings.filterwarnings(
    "ignore",
    message=".*SQLite.*",
    category=UserWarning
)

# ====================== PYTEST CONFIGURATION ======================

def pytest_configure(config):
    """Configure pytest with Django settings."""
    from django.conf import settings
    
    # Use SQLite in-memory database for faster tests
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
    
    # Disable caching in tests
    settings.CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
        }
    }
    
    # Disable Celery for tests
    settings.CELERY_TASK_ALWAYS_EAGER = True
    settings.CELERY_TASK_EAGER_PROPAGATES = True
    
    # Test media root
    settings.MEDIA_ROOT = tempfile.mkdtemp()
    
    # Disable debug toolbar
    settings.DEBUG = False
    settings.INSTALLED_APPS = [
        app for app in settings.INSTALLED_APPS
        if 'debug_toolbar' not in app
    ]
    
    # Disable external APIs
    settings.ENABLE_ACCOUNT_CONFIRMATION_BY_EMAIL = False
    settings.SENDGRID_USERNAME = None
    settings.SENDGRID_PASSWORD = None
    
    # Configure test email backend
    settings.EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'
    
    # Make migrations
    call_command('makemigrations', interactive=False, verbosity=0)
    
    # Setup database
    call_command('migrate', interactive=False, verbosity=0)

def pytest_unconfigure(config):
    """Clean up after tests."""
    import shutil
    from django.conf import settings
    
    # Remove temp media directory
    if hasattr(settings, 'MEDIA_ROOT'):
        shutil.rmtree(settings.MEDIA_ROOT, ignore_errors=True)

@pytest.fixture(scope='session', autouse=True)
def setup_database(django_db_setup, django_db_blocker):
    """Initialize database with test data."""
    with django_db_blocker.unblock():
        from django.core.management import call_command
        # Load initial data if needed
        call_command('loaddata', 'test_data.json', verbosity=0, ignore=True)

# ====================== FACTORIES ======================

@pytest.fixture
def product_factory():
    """Factory for creating Product instances."""
    from saleor.product.models import Product, ProductType, Category
    
    def _create_product(**kwargs):
        defaults = {
            'name': 'Test Product',
            'description': 'Test Description',
            'product_type': ProductType.objects.create(
                name='Test Type',
                slug='test-type'
            ),
            'category': Category.objects.create(
                name='Test Category',
                slug='test-category'
            ),
            'price_amount': 99.99,
            'currency': 'USD',
            'is_published': True,
            'slug': 'test-product',
        }
        defaults.update(kwargs)
        
        return Product.objects.create(**defaults)
    
    return _create_product

@pytest.fixture
def user_factory():
    """Factory for creating User instances."""
    from saleor.account.models import User
    
    def _create_user(**kwargs):
        defaults = {
            'email': 'test@example.com',
            'first_name': 'Test',
            'last_name': 'User',
            'is_active': True,
            'password': 'password123',
        }
        defaults.update(kwargs)
        
        user = User(**defaults)
        if 'password' in defaults:
            user.set_password(defaults['password'])
            defaults.pop('password')
        user.save()
        return user
    
    return _create_user

@pytest.fixture
def order_factory():
    """Factory for creating Order instances."""
    from saleor.order.models import Order
    from saleor.account.models import Address
    
    def _create_order(**kwargs):
        defaults = {
            'user_email': 'customer@example.com',
            'billing_address': Address.objects.create(
                first_name='John',
                last_name='Doe',
                street_address_1='123 Main St',
                city='New York',
                country='US',
                phone='+1234567890'
            ),
            'shipping_address': Address.objects.create(
                first_name='John',
                last_name='Doe',
                street_address_1='123 Main St',
                city='New York',
                country='US',
                phone='+1234567890'
            ),
            'currency': 'USD',
            'total_net_amount': 100.00,
            'total_gross_amount': 118.00,
            'status': 'unfulfilled',
        }
        defaults.update(kwargs)
        
        return Order.objects.create(**defaults)
    
    return _create_order

# ====================== CORE FIXTURES ======================

@pytest.fixture
def admin_user(db, user_factory):
    """Create an admin user."""
    return user_factory(
        email='admin@example.com',
        is_staff=True,
        is_superuser=True
    )

@pytest.fixture
def staff_user(db, user_factory):
    """Create a staff user."""
    return user_factory(
        email='staff@example.com',
        is_staff=True,
        is_superuser=False
    )

@pytest.fixture
def customer_user(db, user_factory):
    """Create a regular customer user."""
    return user_factory(
        email='customer@example.com',
        is_staff=False,
        is_superuser=False
    )

@pytest.fixture
def product_type(db):
    """Create a ProductType instance."""
    from saleor.product.models import ProductType
    return ProductType.objects.create(
        name='Test Type',
        slug='test-type',
        has_variants=True
    )

@pytest.fixture
def category(db):
    """Create a Category instance."""
    from saleor.product.models import Category
    return Category.objects.create(
        name='Test Category',
        slug='test-category'
    )

@pytest.fixture
def product(db, product_type, category):
    """Create a Product instance."""
    from saleor.product.models import Product
    return Product.objects.create(
        name='Test Product',
        slug='test-product',
        product_type=product_type,
        category=category,
        price_amount=99.99,
        currency='USD',
        is_published=True
    )

@pytest.fixture
def product_variant(db, product):
    """Create a ProductVariant instance."""
    from saleor.product.models import ProductVariant
    return ProductVariant.objects.create(
        product=product,
        sku='TEST001',
        name='Test Variant',
        price_amount=99.99,
        currency='USD',
        track_inventory=True
    )

@pytest.fixture
def order(db, customer_user):
    """Create an Order instance."""
    from saleor.order.models import Order
    from saleor.account.models import Address
    
    billing_address = Address.objects.create(
        first_name='John',
        last_name='Doe',
        street_address_1='123 Main St',
        city='New York',
        country='US'
    )
    
    shipping_address = Address.objects.create(
        first_name='John',
        last_name='Doe',
        street_address_1='123 Main St',
        city='New York',
        country='US'
    )
    
    return Order.objects.create(
        user=customer_user,
        user_email=customer_user.email,
        billing_address=billing_address,
        shipping_address=shipping_address,
        currency='USD',
        total_net_amount=100.00,
        total_gross_amount=118.00,
        status='unfulfilled'
    )

@pytest.fixture
def order_line(db, order, product_variant):
    """Create an OrderLine instance."""
    from saleor.order.models import OrderLine
    return OrderLine.objects.create(
        order=order,
        variant=product_variant,
        product_name=product_variant.product.name,
        variant_name=product_variant.name,
        product_sku=product_variant.sku,
        quantity=2,
        unit_price_net_amount=50.00,
        unit_price_gross_amount=59.00,
        total_price_net_amount=100.00,
        total_price_gross_amount=118.00,
    )

@pytest.fixture
def checkout(db, customer_user):
    """Create a Checkout instance."""
    from saleor.checkout.models import Checkout
    return Checkout.objects.create(
        user=customer_user,
        email=customer_user.email,
        currency='USD'
    )

@pytest.fixture
def checkout_line(db, checkout, product_variant):
    """Create a CheckoutLine instance."""
    from saleor.checkout.models import CheckoutLine
    return CheckoutLine.objects.create(
        checkout=checkout,
        variant=product_variant,
        quantity=1
    )

@pytest.fixture
def payment(db, order):
    """Create a Payment instance."""
    from saleor.payment.models import Payment
    return Payment.objects.create(
        gateway='stripe',
        order=order,
        total=order.total_gross_amount,
        currency=order.currency,
        charge_status='charged'
    )

@pytest.fixture
def voucher(db):
    """Create a Voucher instance."""
    from saleor.discount.models import Voucher
    return Voucher.objects.create(
        code='TEST10',
        discount_value_type='percentage',
        discount_value=10.00,
        type='entire_order',
        usage_limit=100
    )

@pytest.fixture
def shipping_method(db):
    """Create a ShippingMethod instance."""
    from saleor.shipping.models import ShippingMethod, ShippingZone
    from saleor.account.models import Country
    
    shipping_zone = ShippingZone.objects.create(name='Test Zone')
    shipping_zone.countries.add(Country.objects.create(code='US'))
    
    return ShippingMethod.objects.create(
        name='Standard Shipping',
        shipping_zone=shipping_zone,
        price_amount=10.00,
        currency='USD'
    )

@pytest.fixture
def warehouse(db):
    """Create a Warehouse instance."""
    from saleor.warehouse.models import Warehouse
    from saleor.account.models import Address
    
    address = Address.objects.create(
        street_address_1='123 Warehouse St',
        city='Warehouse City',
        country='US'
    )
    
    return Warehouse.objects.create(
        name='Test Warehouse',
        address=address,
        slug='test-warehouse'
    )

@pytest.fixture
def stock(db, product_variant, warehouse):
    """Create a Stock instance."""
    from saleor.warehouse.models import Stock
    return Stock.objects.create(
        product_variant=product_variant,
        warehouse=warehouse,
        quantity=100
    )

# ====================== PAYMENT FIXTURES ======================

@pytest.fixture
def stripe_payment(db, order):
    """Create a Stripe payment."""
    from saleor.payment.models import Payment
    return Payment.objects.create(
        gateway='stripe',
        order=order,
        total=order.total_gross_amount,
        currency=order.currency,
        extra_data={
            'payment_intent_id': 'pi_123456',
            'client_secret': 'secret_123',
            'status': 'requires_confirmation'
        }
    )

@pytest.fixture
def razorpay_payment(db, order):
    """Create a Razorpay payment."""
    from saleor.payment.models import Payment
    return Payment.objects.create(
        gateway='razorpay',
        order=order,
        total=order.total_gross_amount,
        currency='INR',
        extra_data={
            'razorpay_order_id': 'order_123456',
            'razorpay_payment_id': 'pay_123456',
            'status': 'captured'
        }
    )

@pytest.fixture
def mock_stripe():
    """Mock Stripe API."""
    from unittest.mock import Mock, patch
    import stripe
    
    with patch('stripe.PaymentIntent.create') as mock_create:
        mock_create.return_value = Mock(
            id='pi_mock_123',
            client_secret='secret_mock_123',
            status='succeeded',
            amount=10000,
            currency='usd'
        )
        yield mock_create

@pytest.fixture
def mock_razorpay():
    """Mock Razorpay API."""
    from unittest.mock import Mock, patch
    
    with patch('razorpay.Client') as mock_client_class:
        mock_client = Mock()
        mock_client_class.return_value = mock_client
        
        mock_client.order.create.return_value = {
            'id': 'order_mock_123',
            'amount': 10000,
            'currency': 'INR',
            'status': 'created'
        }
        
        yield mock_client

# ====================== GRAPHQL FIXTURES ======================

@pytest.fixture
def api_client():
    """GraphQL test client."""
    from graphene.test import Client
    from saleor.graphql.api.schema import schema
    return Client(schema)

@pytest.fixture
def graphql_context(staff_user):
    """GraphQL execution context."""
    from unittest.mock import Mock
    return Mock(
        user=staff_user,
        request=Mock(),
        plugins=[],
        app=None,
        get_plugins=lambda: []
    )

# ====================== HELPER FIXTURES ======================

@pytest.fixture
def django_assert_num_queries():
    """Fixture to assert number of database queries."""
    from django.test.utils import CaptureQueriesContext
    from django.db import connection
    
    def _assert_num_queries(num, func=None, *args, **kwargs):
        context = CaptureQueriesContext(connection)
        
        if func is None:
            return context
        
        with context:
            func(*args, **kwargs)
            executed = len(context)
            assert executed == num, \
                f"Expected {num} queries but executed {executed}"
    
    return _assert_num_queries

@pytest.fixture
def freeze_time():
    """Fixture to freeze time for testing."""
    from freezegun import freeze_time
    return freeze_time

@pytest.fixture
def mailoutbox():
    """Fixture to access sent emails."""
    from django.core import mail
    return mail.outbox

@pytest.fixture
def site_settings(db):
    """Fixture for SiteSettings."""
    from saleor.site.models import SiteSettings
    return SiteSettings.objects.get()

# ====================== TEST DATABASE CLEANUP ======================

@pytest.fixture(autouse=True)
def cleanup_database(db):
    """Clean up database after each test."""
    yield
    
    # Clean up any created files
    import shutil
    from django.conf import settings
    
    if hasattr(settings, 'MEDIA_ROOT'):
        for root, dirs, files in os.walk(settings.MEDIA_ROOT):
            for f in files:
                os.unlink(os.path.join(root, f))
            for d in dirs:
                shutil.rmtree(os.path.join(root, d))

# ====================== CUSTOM FIXTURES FOR YOUR MODIFICATIONS ======================

@pytest.fixture
def custom_config(db, site_settings):
    """Fixture with custom configuration for your modifications."""
    # Add your custom site settings here
    site_settings.enable_custom_feature = True
    site_settings.custom_tax_rate = 18.0  # GST
    site_settings.save()
    return site_settings

@pytest.fixture
def tax_configuration(db):
    """Fixture for tax configuration."""
    from saleor.core.taxes import TaxConfiguration
    
    config = TaxConfiguration.objects.create(
        charge_taxes=True,
        display_gross_prices=True,
        prices_entered_with_tax=True,
        country='PK',  # Pakistan
        tax_calculation_strategy='FLAT_RATES'
    )
    return config

# ====================== TEST MARKS AND HOOKS ======================

def pytest_collection_modifyitems(config, items):
    """Modify test items to handle slow tests."""
    skip_slow = pytest.mark.skip(reason="slow test - use -m 'not slow' to run")
    skip_integration = pytest.mark.skip(reason="integration test")
    
    for item in items:
        # Mark slow tests
        if "slow" in item.keywords:
            item.add_marker(skip_slow)
        
        # Mark integration tests
        if "integration" in item.keywords:
            item.add_marker(skip_integration)
        
        # Ensure all tests use database
        if "django_db" not in [marker.name for marker in item.own_markers]:
            item.add_marker(pytest.mark.django_db)

@pytest.fixture(autouse=True)
def enable_db_access_for_all_tests(db):
    """Enable database access for all tests."""
    pass

# ====================== PYTEST ADDOPTIONS ======================

def pytest_addoption(parser):
    """Add custom command line options."""
    parser.addoption(
        "--runslow",
        action="store_true",
        default=False,
        help="run slow tests"
    )
    parser.addoption(
        "--runintegration",
        action="store_true",
        default=False,
        help="run integration tests"
    )
    parser.addoption(
        "--external",
        action="store_true",
        default=False,
        help="run tests that require external services"
    )

# ====================== TEST CLASS MIXINS ======================

class BaseTest(TestCase):
    """Base test class with common utilities."""
    
    def setUp(self):
        """Set up test data."""
        super().setUp()
        self.maxDiff = None  # Show full diff in assertions
    
    def assert_queryset_equal(self, qs1, qs2, transform=lambda x: x):
        """Assert that two querysets are equal."""
        return self.assertQuerysetEqual(
            qs1.order_by('pk'),
            qs2.order_by('pk'),
            transform
        )
    
    def assert_email_sent(self, subject=None, to=None):
        """Assert that an email was sent."""
        from django.core import mail
        
        self.assertGreater(len(mail.outbox), 0, "No emails were sent")
        
        if subject:
            self.assertIn(subject, mail.outbox[-1].subject)
        
        if to:
            self.assertEqual(mail.outbox[-1].to, [to])

@pytest.fixture
def base_test():
    """Fixture providing BaseTest class methods."""
    return BaseTest