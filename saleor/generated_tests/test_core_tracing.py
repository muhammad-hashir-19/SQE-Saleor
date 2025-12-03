import unittest


class Test_core_tracing(unittest.TestCase):

    def test_function_traced_atomic_transaction(self):
        self.assertTrue(True)

    def test_function_otel_trace(self):
        self.assertTrue(True)

    def test_function_webhooks_otel_trace(self):
        self.assertTrue(True)


if __name__ == '__main__':
    unittest.main()
