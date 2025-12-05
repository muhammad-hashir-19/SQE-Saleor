"""
Test helper functions for SQE-Saleor.
"""

import json
from decimal import Decimal
from typing import Any, Dict, List, Optional
from unittest.mock import Mock, patch

from django.test import TestCase
from django.utils import timezone


class TestHelpers:
    """Collection of helper methods for tests."""
    
    @staticmethod
    def assert_dict_contains_subset(subset: Dict, superset: Dict) -> bool:
        """Assert that subset is contained in superset."""
        for key, value in subset.items():
            assert key in superset, f"Key '{key}' not found in superset"
            if isinstance(value, dict):
                TestHelpers.assert_dict_contains_subset(value, superset[key])
            else:
                assert superset[key] == value, \
                    f"Value mismatch for key '{key}': {superset[key]} != {value}"
        return True
    
    @staticmethod
    def create_test_payment_data(**kwargs) -> Dict:
        """Create test payment data."""
        defaults = {
            "gateway": "stripe",
            "total": "100.00",
            "currency": "USD",
            "token": "tok_test_123",
            "customer_id": "cus_test_123",
            "return_url": "https://example.com/success",
            "extra_data": {
                "payment_intent_id": "pi_123",
                "client_secret": "secret_123"
            }
        }
        defaults.update(kwargs)
        return defaults
    
    @staticmethod
    def mock_stripe_response(**kwargs) -> Mock:
        """Create a mock Stripe response."""
        response = Mock()
        response.id = kwargs.get("id", "pi_123")
        response.client_secret = kwargs.get("client_secret", "secret_123")
        response.status = kwargs.get("status", "succeeded")
        response.amount = kwargs.get("amount", 10000)
        response.currency = kwargs.get("currency", "usd")
        response.metadata = kwargs.get("metadata", {})
        return response
    
    @staticmethod
    def assert_json_response(response, expected_status=200, **kwargs):
        """Assert JSON response structure."""
        assert response.status_code == expected_status
        data = json.loads(response.content)
        
        if "data" in kwargs:
            TestHelpers.assert_dict_contains_subset(kwargs["data"], data.get("data", {}))
        
        if "errors" in kwargs:
            if kwargs["errors"] is None:
                assert "errors" not in data or not data["errors"]
            else:
                assert "errors" in data
        
        return data


class PaymentTestMixin:
    """Mixin for payment-related tests."""
    
    def mock_stripe_api(self, **kwargs):
        """Mock Stripe API calls."""
        stripe_patches = {
            'PaymentIntent.create': Mock(return_value=self.create_stripe_payment_intent(**kwargs)),
            'PaymentIntent.retrieve': Mock(return_value=self.create_stripe_payment_intent(**kwargs)),
            'PaymentIntent.confirm': Mock(return_value=self.create_stripe_payment_intent(**kwargs)),
            'Webhook.construct_event': Mock(return_value={'type': 'payment_intent.succeeded'}),
        }
        
        patchers = {name: patch(f'stripe.{name}', value) 
                   for name, value in stripe_patches.items()}
        
        for patcher in patchers.values():
            patcher.start()
        
        self.addCleanup(lambda: [p.stop() for p in patchers.values()])
    
    def create_stripe_payment_intent(self, **kwargs):
        """Create a mock Stripe PaymentIntent."""
        intent = Mock()
        intent.id = kwargs.get('id', 'pi_test_123')
        intent.client_secret = kwargs.get('client_secret', 'secret_test_123')
        intent.status = kwargs.get('status', 'succeeded')
        intent.amount = kwargs.get('amount', 10000)
        intent.currency = kwargs.get('currency', 'usd')
        intent.metadata = kwargs.get('metadata', {})
        intent.last_payment_error = kwargs.get('last_payment_error')
        return intent


class EmailTestMixin:
    """Mixin for email-related tests."""
    
    def assert_email_sent(self, count=1, subject=None, to=None):
        """Assert that emails were sent."""
        from django.core import mail
        
        assert len(mail.outbox) == count, \
            f"Expected {count} emails, got {len(mail.outbox)}"
        
        if count > 0:
            email = mail.outbox[0]
            
            if subject:
                assert subject in email.subject, \
                    f"Subject '{subject}' not found in '{email.subject}'"
            
            if to:
                if isinstance(to, str):
                    to = [to]
                assert email.to == to, \
                    f"Expected recipients {to}, got {email.to}"


class GraphQLTestMixin:
    """Mixin for GraphQL tests."""
    
    def execute_query(self, query, variables=None, user=None, **kwargs):
        """Execute a GraphQL query."""
        from graphene.test import Client
        from saleor.graphql.api.schema import schema
        
        client = Client(schema)
        context = Mock(user=user, request=Mock()) if user else None
        
        return client.execute(
            query,
            variables=variables or {},
            context_value=context,
            **kwargs
        )
    
    def assert_graphql_response(self, response, has_data=True, has_errors=False):
        """Assert GraphQL response structure."""
        if has_data:
            assert "data" in response, f"No data in response: {response}"
        
        if has_errors:
            assert "errors" in response, f"No errors in response: {response}"
        else:
            assert "errors" not in response or not response["errors"], \
                f"Unexpected errors: {response.get('errors')}"


# Export helpers
__all__ = [
    'TestHelpers',
    'PaymentTestMixin',
    'EmailTestMixin',
    'GraphQLTestMixin'
]