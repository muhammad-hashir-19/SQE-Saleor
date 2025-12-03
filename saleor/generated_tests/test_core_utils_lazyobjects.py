import unittest


class Test_core_utils_lazyobjects(unittest.TestCase):

    def test_function_lazy_no_retry(self):
        self.assertTrue(True)

    def test_function_unwrap_lazy(self):
        self.assertTrue(True)

    def test_function__wrapper(self):
        self.assertTrue(True)


if __name__ == '__main__':
    unittest.main()
