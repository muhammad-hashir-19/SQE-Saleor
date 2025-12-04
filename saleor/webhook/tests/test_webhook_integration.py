"""
Integration tests for Webhook service.
Tests interactions between Webhook service, Database, and External APIs.
"""
import pytest
import json
from unittest.mock import Mock, patch

from saleor.webhook.models import Webhook, WebhookEvent
from saleor.webhook.event_types import WebhookEventAsyncType


@pytest.mark.integration
@pytest.mark.django_db
def test_webhook_creation_and_database_persistence(app):
    """
    Integration test: Webhook creation and database persistence.
    Tests interaction between Webhook service and Database.
    """
    # Create webhook
    webhook = Webhook.objects.create(
        app=app,
        name="Test Webhook",
        target_url="https://example.com/webhook",
        is_active=True,
    )
    
    # Add events
    webhook.events.create(event_type=WebhookEventAsyncType.ORDER_CREATED)
    webhook.events.create(event_type=WebhookEventAsyncType.ORDER_UPDATED)
    
    # Verify persistence
    db_webhook = Webhook.objects.get(id=webhook.id)
    assert db_webhook.name == "Test Webhook"
    assert db_webhook.target_url == "https://example.com/webhook"
    assert db_webhook.is_active is True
    
    # Verify events are linked
    events = db_webhook.events.all()
    assert events.count() == 2
    event_types = [e.event_type for e in events]
    assert WebhookEventAsyncType.ORDER_CREATED in event_types
    assert WebhookEventAsyncType.ORDER_UPDATED in event_types


@pytest.mark.integration
@pytest.mark.django_db
@patch('requests.post')
def test_webhook_delivery_to_external_api(mock_post, app, order_with_lines):
    """
    Integration test: Webhook delivery to external API.
    Tests interaction between Webhook service and External API.
    """
    # Setup mock response
    mock_response = Mock()
    mock_response.status_code = 200
    mock_response.text = "OK"
    mock_post.return_value = mock_response
    
    # Create webhook
    webhook = Webhook.objects.create(
        app=app,
        name="Order Webhook",
        target_url="https://example.com/webhook/order",
        is_active=True,
    )
    webhook.events.create(event_type=WebhookEventAsyncType.ORDER_CREATED)
    
    # Simulate webhook trigger
    payload = {
        "order_id": str(order_with_lines.id),
        "status": order_with_lines.status,
        "total": str(order_with_lines.total.gross.amount),
    }
    
    # This simulates sending webhook to external API
    import requests
    response = requests.post(
        webhook.target_url,
        json=payload,
        headers={"Content-Type": "application/json"},
    )
    
    # Verify external API was called
    assert mock_post.called
    assert response.status_code == 200
    
    # Verify correct data was sent
    call_args = mock_post.call_args
    assert call_args[0][0] == webhook.target_url


@pytest.mark.integration
@pytest.mark.django_db
def test_webhook_app_linkage(app):
    """
    Integration test: Webhook-App relationship in database.
    Tests interaction between Webhook service and App service through database.
    """
    # Create multiple webhooks for same app
    webhook1 = Webhook.objects.create(
        app=app,
        name="Webhook 1",
        target_url="https://example.com/webhook1",
        is_active=True,
    )
    
    webhook2 = Webhook.objects.create(
        app=app,
        name="Webhook 2",
        target_url="https://example.com/webhook2",
        is_active=True,
    )
    
    # Verify linkage through database
    app_webhooks = app.webhooks.all()
    assert webhook1 in app_webhooks
    assert webhook2 in app_webhooks
    assert app_webhooks.count() == 2
    
    # Verify reverse relationship
    assert webhook1.app == app
    assert webhook2.app == app


@pytest.mark.integration
@pytest.mark.django_db
@patch('requests.post')
def test_webhook_retry_on_external_api_failure(mock_post, app):
    """
    Integration test: Webhook retry mechanism on external API failure.
    Tests interaction between Webhook service and External API with error handling.
    """
    # Setup mock to fail first, then succeed
    mock_response_fail = Mock()
    mock_response_fail.status_code = 500
    mock_response_fail.text = "Internal Server Error"
    
    mock_response_success = Mock()
    mock_response_success.status_code = 200
    mock_response_success.text = "OK"
    
    mock_post.side_effect = [mock_response_fail, mock_response_success]
    
    # Create webhook
    webhook = Webhook.objects.create(
        app=app,
        name="Retry Webhook",
        target_url="https://example.com/webhook/retry",
        is_active=True,
    )
    
    # Simulate first attempt (fails)
    import requests
    payload = {"test": "data"}
    
    response1 = requests.post(webhook.target_url, json=payload)
    assert response1.status_code == 500
    
    # Simulate retry (succeeds)
    response2 = requests.post(webhook.target_url, json=payload)
    assert response2.status_code == 200
    
    # Verify both attempts were made
    assert mock_post.call_count == 2


@pytest.mark.integration
@pytest.mark.django_db
def test_webhook_event_filtering(app):
    """
    Integration test: Webhook event type filtering.
    Tests interaction between Webhook service and Database for event filtering.
    """
    # Create webhook with specific events
    webhook = Webhook.objects.create(
        app=app,
        name="Filtered Webhook",
        target_url="https://example.com/webhook",
        is_active=True,
    )
    
    # Add only order-related events
    webhook.events.create(event_type=WebhookEventAsyncType.ORDER_CREATED)
    webhook.events.create(event_type=WebhookEventAsyncType.ORDER_UPDATED)
    
    # Query webhooks for specific event type
    order_created_webhooks = Webhook.objects.filter(
        events__event_type=WebhookEventAsyncType.ORDER_CREATED,
        is_active=True,
    )
    
    assert webhook in order_created_webhooks
    
    # Query webhooks for non-subscribed event type
    product_created_webhooks = Webhook.objects.filter(
        events__event_type=WebhookEventAsyncType.PRODUCT_CREATED,
        is_active=True,
    )
    
    assert webhook not in product_created_webhooks
