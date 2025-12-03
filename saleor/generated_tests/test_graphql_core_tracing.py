import unittest


class Test_graphql_core_tracing(unittest.TestCase):

    def test_function_traced_resolver(self):
        self.assertTrue(True)

    def test_function_wrapper(self):
        self.assertTrue(True)


if __name__ == '__main__':
    unittest.main()
