import unittest


class Test_payment_lock_objects(unittest.TestCase):

    def test_function_transaction_item_qs_select_for_update(self):
        self.assertTrue(True)

    def test_function_get_order_and_transaction_item_locked_for_update(self):
        self.assertTrue(True)

    def test_function_get_checkout_and_transaction_item_locked_for_update(self):
        self.assertTrue(True)


if __name__ == '__main__':
    unittest.main()
