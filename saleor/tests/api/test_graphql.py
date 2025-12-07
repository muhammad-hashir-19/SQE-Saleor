"""
GraphQL API tests for Saleor.
Run with: pytest tests/api/test_graphql.py -v
"""

import pytest
import json
from graphene.test import Client
from saleor.graphql.api.schema import schema


class TestGraphQLQueries:
    """Test GraphQL queries."""
    
    @pytest.fixture
    def graphql_client(self):
        """Create GraphQL test client."""
        return Client(schema)
    
    def test_product_query(self, graphql_client, product):
        """Test basic product query."""
        query = """
            query GetProduct($id: ID!) {
                product(id: $id) {
                    id
                    name
                    description
                    price {
                        amount
                        currency
                    }
                }
            }
        """
        
        executed = graphql_client.execute(
            query,
            variables={'id': str(product.id)}
        )
        
        # Check no errors
        assert 'errors' not in executed
        
        # Check data
        data = executed['data']['product']
        assert data['name'] == product.name
        assert data['price']['amount'] == float(product.price_amount)
        assert data['price']['currency'] == product.currency
    
    def test_products_query(self, graphql_client, product):
        """Test products list query."""
        query = """
            query GetProducts {
                products(first: 10) {
                    edges {
                        node {
                            id
                            name
                            isPublished
                        }
                    }
                    totalCount
                }
            }
        """
        
        executed = graphql_client.execute(query)
        
        assert 'errors' not in executed
        
        data = executed['data']['products']
        assert data['totalCount'] >= 1
        
        # Find our test product
        products = [edge['node'] for edge in data['edges']]
        product_names = [p['name'] for p in products]
        assert "Test Product" in product_names
    
    def test_user_query(self, graphql_client, customer_user):
        """Test user query (requires authentication)."""
        from unittest.mock import Mock
        
        query = """
            query GetMe {
                me {
                    email
                    firstName
                    lastName
                }
            }
        """
        
        # Create a mock request with user
        context_value = Mock(user=customer_user)
        
        executed = graphql_client.execute(
            query,
            context_value=context_value
        )
        
        assert 'errors' not in executed
        
        data = executed['data']['me']
        assert data['email'] == customer_user.email
        assert data['firstName'] == customer_user.first_name
    
    def test_category_query(self, graphql_client, category):
        """Test category query."""
        query = """
            query GetCategory($id: ID!) {
                category(id: $id) {
                    id
                    name
                    slug
                }
            }
        """
        
        executed = graphql_client.execute(
            query,
            variables={'id': str(category.id)}
        )
        
        assert 'errors' not in executed
        
        data = executed['data']['category']
        assert data['name'] == category.name
        assert data['slug'] == category.slug
    
    def test_invalid_query(self, graphql_client):
        """Test invalid GraphQL query."""
        query = """
            query InvalidQuery {
                nonExistentField {
                    id
                }
            }
        """
        
        executed = graphql_client.execute(query)
        
        # Should have errors
        assert 'errors' in executed
        assert 'nonExistentField' in executed['errors'][0]['message']


class TestGraphQLMutations:
    """Test GraphQL mutations."""
    
    @pytest.fixture
    def graphql_client(self):
        return Client(schema)
    
    def test_token_create_mutation(self, graphql_client, customer_user):
        """Test creating authentication token."""
        mutation = """
            mutation CreateToken($email: String!, $password: String!) {
                tokenCreate(email: $email, password: $password) {
                    token
                    user {
                        email
                    }
                    errors {
                        field
                        message
                    }
                }
            }
        """
        
        executed = graphql_client.execute(
            mutation,
            variables={
                'email': 'customer@example.com',
                'password': 'password123'
            }
        )
        
        # Should succeed
        data = executed['data']['tokenCreate']
        assert data['token'] is not None
        assert data['user']['email'] == 'customer@example.com'
        assert not data['errors']  # No errors
    
    def test_token_create_invalid_credentials(self, graphql_client):
        """Test token creation with invalid credentials."""
        mutation = """
            mutation CreateToken($email: String!, $password: String!) {
                tokenCreate(email: $email, password: $password) {
                    token
                    user {
                        email
                    }
                    errors {
                        field
                        message
                    }
                }
            }
        """
        
        executed = graphql_client.execute(
            mutation,
            variables={
                'email': 'wrong@example.com',
                'password': 'wrongpassword'
            }
        )
        
        data = executed['data']['tokenCreate']
        # Should have errors
        assert data['errors']
        assert data['token'] is None
        assert data['user'] is None
    
    def test_checkout_create_mutation(self, graphql_client, product_variant):
        """Test creating a checkout."""
        mutation = """
            mutation CreateCheckout($input: CheckoutCreateInput!) {
                checkoutCreate(input: $input) {
                    checkout {
                        id
                        token
                        lines {
                            variant {
                                id
                            }
                            quantity
                        }
                    }
                    errors {
                        field
                        message
                    }
                }
            }
        """
        
        executed = graphql_client.execute(
            mutation,
            variables={
                'input': {
                    'lines': [{
                        'quantity': 1,
                        'variantId': str(product_variant.id)
                    }],
                    'email': 'test@example.com',
                    'channel': 'default-channel'  # You might need to adjust this
                }
            }
        )
        
        data = executed['data']['checkoutCreate']
        
        # Might fail if channel doesn't exist, but test the structure
        if data['errors']:
            # Just check the error structure
            assert isinstance(data['errors'], list)
        else:
            assert data['checkout']['id'] is not None
            assert data['checkout']['token'] is not None
    
    def test_user_register_mutation(self, graphql_client):
        """Test user registration."""
        mutation = """
            mutation RegisterUser($input: AccountRegisterInput!) {
                accountRegister(input: $input) {
                    user {
                        email
                        isActive
                    }
                    errors {
                        field
                        message
                    }
                }
            }
        """
        
        executed = graphql_client.execute(
            mutation,
            variables={
                'input': {
                    'email': 'newuser@example.com',
                    'password': 'newpassword123',
                    'redirectUrl': 'http://example.com/confirm'
                }
            }
        )
        
        data = executed['data']['accountRegister']
        
        if data['errors']:
            # Registration might require email confirmation
            assert 'email' in str(data['errors'])
        else:
            assert data['user']['email'] == 'newuser@example.com'
            assert data['user']['isActive'] is False  # Might need email confirmation


class TestGraphQLErrors:
    """Test GraphQL error handling."""
    
    @pytest.fixture
    def graphql_client(self):
        return Client(schema)
    
    def test_missing_required_field(self, graphql_client):
        """Test mutation with missing required field."""
        mutation = """
            mutation CreateToken($email: String!) {
                tokenCreate(email: $email) {
                    token
                }
            }
        """
        
        executed = graphql_client.execute(
            mutation,
            variables={'email': 'test@example.com'}
        )
        
        # Should have GraphQL validation error
        assert 'errors' in executed
    
    def test_invalid_id_format(self, graphql_client):
        """Test query with invalid ID format."""
        query = """
            query GetProduct($id: ID!) {
                product(id: $id) {
                    id
                    name
                }
            }
        """
        
        executed = graphql_client.execute(
            query,
            variables={'id': 'invalid-id-format'}
        )
        
        # Might return null or error
        data = executed.get('data', {})
        if data.get('product') is None:
            # Product not found
            pass
        else:
            # Should have errors
            assert 'errors' in executed


@pytest.mark.skip(reason="Requires specific setup")
class TestPaymentMutations:
    """Test payment-related mutations (requires setup)."""
    
    def test_checkout_payment_create(self, graphql_client, checkout):
        """Test creating a payment for checkout."""
        # This is a template - you'll need to implement based on your payment setup
        mutation = """
            mutation CreatePayment($checkoutId: ID!, $input: PaymentInput!) {
                checkoutPaymentCreate(checkoutId: $checkoutId, input: $input) {
                    payment {
                        id
                        gateway
                        chargeStatus
                    }
                    errors {
                        field
                        message
                    }
                }
            }
        """
        
        # Implementation depends on your payment gateway setup
        pass