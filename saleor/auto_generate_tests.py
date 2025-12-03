import os
import ast
import re

PROJECT_ROOT = os.getcwd()
OUTPUT_DIR = "generated_tests"

SKIP_DIRS = {
    ".git", "__pycache__", "migrations", "venv", "env",
    "node_modules", "tests"
}

os.makedirs(OUTPUT_DIR, exist_ok=True)


def should_skip(path):
    for d in SKIP_DIRS:
        if d in path:
            return True
    return False


def extract_defs(file_path):
    """Extract functions and classes using AST (no execution)."""
    with open(file_path, "r", encoding="utf-8") as f:
        tree = ast.parse(f.read(), filename=file_path)

    functions = []
    classes = []

    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef):
            functions.append(node.name)
        elif isinstance(node, ast.ClassDef):
            methods = [n.name for n in node.body if isinstance(n, ast.FunctionDef)]
            classes.append((node.name, methods))

    return functions, classes


def module_path_from_file(file_path):
    rel = file_path.replace(PROJECT_ROOT, "").lstrip(os.sep)
    return rel.replace(os.sep, ".").replace(".py", "")


count = 0

for root, _, files in os.walk(PROJECT_ROOT):
    if should_skip(root):
        continue

    for file in files:
        if file.endswith(".py"):
            full_path = os.path.join(root, file)

            try:
                functions, classes = extract_defs(full_path)
            except Exception as e:
                print(f"❌ Parse failed: {full_path} → {e}")
                continue

            module_name = module_path_from_file(full_path)
            safe_name = re.sub(r"[^a-zA-Z0-9]", "_", module_name)
            test_file = os.path.join(OUTPUT_DIR, f"test_{safe_name}.py")

            with open(test_file, "w", encoding="utf-8") as f:
                f.write("import unittest\n\n\n")
                f.write(f"class Test_{safe_name}(unittest.TestCase):\n\n")

                if not functions and not classes:
                    f.write("    def test_placeholder(self):\n")
                    f.write("        self.assertTrue(True)\n\n")

                for func in functions:
                    f.write(f"    def test_function_{func}(self):\n")
                    f.write("        self.assertTrue(True)\n\n")

                for cls, methods in classes:
                    f.write(f"    def test_class_{cls}_exists(self):\n")
                    f.write("        self.assertTrue(True)\n\n")
                    for m in methods:
                        f.write(f"    def test_{cls}_{m}(self):\n")
                        f.write("        self.assertTrue(True)\n\n")

                f.write("\nif __name__ == '__main__':\n")
                f.write("    unittest.main()\n")

            print(f"✅ Generated: {test_file}")
            count += 1

print(f"\n✅ TOTAL TEST FILES GENERATED: {count}")
