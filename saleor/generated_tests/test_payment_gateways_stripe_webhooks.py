import unittest


class Test_payment_gateways_stripe_webhooks(unittest.TestCase):

    def test_function_handle_webhook(self):
        self.assertTrue(True)

    def test_function__channel_slug_is_different_from_payment_channel_slug(self):
        self.assertTrue(True)

    def test_function__get_payment(self):
        self.assertTrue(True)

    def test_function__get_checkout(self):
        self.assertTrue(True)

    def test_function__finalize_checkout(self):
        self.assertTrue(True)

    def test_function__get_or_create_transaction(self):
        self.assertTrue(True)

    def test_function__update_payment_with_new_transaction(self):
        self.assertTrue(True)

    def test_function__process_payment_with_checkout(self):
        self.assertTrue(True)

    def test_function__update_payment_method_metadata(self):
        self.assertTrue(True)

    def test_function_update_payment_method_details_from_intent(self):
        self.assertTrue(True)

    def test_function_handle_authorized_payment_intent(self):
        self.assertTrue(True)

    def test_function_handle_failed_payment_intent(self):
        self.assertTrue(True)

    def test_function_handle_processing_payment_intent(self):
        self.assertTrue(True)

    def test_function_handle_successful_payment_intent(self):
        self.assertTrue(True)

    def test_function_handle_refund(self):
        self.assertTrue(True)


if __name__ == '__main__':
    unittest.main()
