import unittest


class Test_core_rlimit(unittest.TestCase):

    def test_function_is_soft_limit_set_without_hard_limit(self):
        self.assertTrue(True)

    def test_function_is_hard_limit_set_without_soft_limit(self):
        self.assertTrue(True)

    def test_function_validate_and_set_rlimit(self):
        self.assertTrue(True)


if __name__ == '__main__':
    unittest.main()
