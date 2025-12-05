import sys
import os

def test_print_sys_path():
    print("\nDEBUG: sys.path:")
    for p in sys.path:
        print(f"  {p}")
    
    try:
        import graphql
        print(f"\nDEBUG: graphql module file: {graphql.__file__}")
    except ImportError as e:
        print(f"\nDEBUG: Could not import graphql: {e}")
    except AttributeError:
         print(f"\nDEBUG: graphql module imported but has no __file__")

    assert False, "Force fail to see output"
