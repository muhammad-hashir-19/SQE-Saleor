#!/usr/bin/env python
"""Simple test runner to avoid pytest-django import issues."""
import os
import sys
import django

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'saleor.settings')

# Add project to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Setup Django
django.setup()

# Now run pytest
import pytest

if __name__ == '__main__':
    sys.exit(pytest.main([
        'saleor/core/utils/tests',
        '-v',
        '--tb=short',
    ]))
