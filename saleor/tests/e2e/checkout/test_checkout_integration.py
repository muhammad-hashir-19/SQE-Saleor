import pytest

from saleor.payment import ChargeStatus, TransactionKind
from saleor.payment.models import Payment, Transaction
from ..product.utils.preparing_product import prepare_product
from ..shop.utils.preparing_shop import prepare_default_shop
from ..utils import assign_permissions
from .utils import (
    checkout_complete,
    checkout_create,
    checkout_delivery_method_update,
    checkout_dummy_payment_create,
    checkout_shipping_address_update,
)


@pytest.mark.e2e
def test_checkout_flow_with_payment_and_db_verification(
    e2e_staff_api_client,
    e2e_not_logged_api_client,
    permission_manage_product_types_and_attributes,
    permission_manage_orders,
    permission_manage_checkouts,
    shop_permissions,
):
    """
    Integration test for the full checkout flow.
    Tests interaction between:
    1. Checkout Service (creating checkout, setting address/shipping)
    2. Payment Service (creating payment, processing transaction)
    3. Order Service (creating order from checkout)
    4. Database (verifying persistence of Payment and Transaction records)
    """
    # Before - Setup Shop and Permissions
    permissions = [
        permission_manage_product_types_and_attributes,
        permission_manage_orders,
        permission_manage_checkouts,
        *shop_permissions,
    ]
    assign_permissions(e2e_staff_api_client, permissions)

    shop_data = prepare_default_shop(e2e_staff_api_client)

    channel_id = shop_data["channel"]["id"]
    channel_slug = shop_data["channel"]["slug"]
    warehouse_id = shop_data["warehouse"]["id"]
    shipping_method_id = shop_data["shipping_method"]["id"]

    variant_price = 10

    (
        _product_id,
        product_variant_id,
        _product_variant_price,
    ) = prepare_product(
        e2e_staff_api_client,
        warehouse_id,
        channel_id,
        variant_price,
    )

    # Step 1 - Create checkout.
    lines = [
        {
            "variantId": product_variant_id,
            "quantity": 1,
        },
    ]
    checkout_data = checkout_create(
        e2e_not_logged_api_client,
        lines,
        channel_slug,
        email="testIntegration@example.com",
        shipping_address=None,
    )
    checkout_id = checkout_data["id"]

    assert checkout_data["isShippingRequired"] is True

    # Step 2 - Set shipping address for checkout.
    checkout_data = checkout_shipping_address_update(
        e2e_not_logged_api_client,
        checkout_id,
    )

    # Step 3 - Set DeliveryMethod for checkout.
    checkout_data = checkout_delivery_method_update(
        e2e_not_logged_api_client,
        checkout_id,
        shipping_method_id,
    )
    total_gross_amount = checkout_data["totalPrice"]["gross"]["amount"]

    # Step 4 - Create payment for checkout (Interaction with Payment Service).
    checkout_dummy_payment_create(
        e2e_not_logged_api_client,
        checkout_id,
        total_gross_amount,
    )

    # Step 5 - Complete checkout (Interaction with Order Service).
    order_data = checkout_complete(
        e2e_not_logged_api_client,
        checkout_id,
    )
    
    order_id = order_data["id"]
    assert order_data["status"] == "UNFULFILLED"
    assert order_data["total"]["gross"]["amount"] == total_gross_amount

    # Step 6 - Verify Database State (Interaction with Database).
    # We need to decode the ID from GraphQL global ID to DB ID if necessary, 
    # but models usually work with internal IDs. 
    # However, the fixtures and API return Global IDs (base64 encoded).
    # For direct DB access, we might need to query by other fields or decode the ID.
    # Let's query by the email we used.
    
    # Verify Payment
    payment = Payment.objects.get(billing_email="testIntegration@example.com", is_active=True)
    assert payment.charge_status == ChargeStatus.FULLY_CHARGED
    assert payment.total == total_gross_amount
    assert payment.currency == "USD" # Default shop currency
    
    # Verify Transaction
    transaction = Transaction.objects.filter(payment=payment).last()
    assert transaction is not None
    assert transaction.kind == TransactionKind.CAPTURE # Dummy payment usually captures immediately
    assert transaction.is_success is True
    assert transaction.amount == total_gross_amount
    
    # Verify Order linkage
    assert payment.order is not None
    # We can't easily compare the GraphQL ID 'order_id' with payment.order.id (int) 
    # without decoding, but we can check if the order exists.
    assert payment.order.user_email == "testIntegration@example.com"
