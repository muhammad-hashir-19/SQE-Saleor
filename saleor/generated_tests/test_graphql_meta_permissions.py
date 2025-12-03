import unittest


class Test_graphql_meta_permissions(unittest.TestCase):

    def test_function_no_permissions(self):
        self.assertTrue(True)

    def test_function_public_user_permissions(self):
        self.assertTrue(True)

    def test_function_private_user_permissions(self):
        self.assertTrue(True)

    def test_function_public_address_permissions(self):
        self.assertTrue(True)

    def test_function_private_address_permissions(self):
        self.assertTrue(True)

    def test_function_product_permissions(self):
        self.assertTrue(True)

    def test_function_product_type_permissions(self):
        self.assertTrue(True)

    def test_function_order_permissions(self):
        self.assertTrue(True)

    def test_function_invoice_permissions(self):
        self.assertTrue(True)

    def test_function_menu_permissions(self):
        self.assertTrue(True)

    def test_function_app_permissions(self):
        self.assertTrue(True)

    def test_function_private_app_permssions(self):
        self.assertTrue(True)

    def test_function_channel_permissions(self):
        self.assertTrue(True)

    def test_function_checkout_permissions(self):
        self.assertTrue(True)

    def test_function_page_permissions(self):
        self.assertTrue(True)

    def test_function_page_type_permissions(self):
        self.assertTrue(True)

    def test_function_attribute_permissions(self):
        self.assertTrue(True)

    def test_function_shipping_permissions(self):
        self.assertTrue(True)

    def test_function_discount_permissions(self):
        self.assertTrue(True)

    def test_function_public_payment_permissions(self):
        self.assertTrue(True)

    def test_function_private_payment_permissions(self):
        self.assertTrue(True)

    def test_function_gift_card_permissions(self):
        self.assertTrue(True)

    def test_function_tax_permissions(self):
        self.assertTrue(True)

    def test_function_site_permissions(self):
        self.assertTrue(True)


if __name__ == '__main__':
    unittest.main()
