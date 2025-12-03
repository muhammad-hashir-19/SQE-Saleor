import unittest


class Test_permission_utils(unittest.TestCase):

    def test_function_all_permissions_required(self):
        self.assertTrue(True)

    def test_function_one_of_permissions_or_auth_filter_required(self):
        self.assertTrue(True)

    def test_function__get_result_of_permissions_checks(self):
        self.assertTrue(True)

    def test_function__get_result_of_authorization_filters_checks(self):
        self.assertTrue(True)

    def test_function_permission_required(self):
        self.assertTrue(True)

    def test_function_has_one_of_permissions(self):
        self.assertTrue(True)

    def test_function_message_one_of_permissions_required(self):
        self.assertTrue(True)


if __name__ == '__main__':
    unittest.main()
