# How to Run Integration Tests

## 🚀 Recommended Method: Docker Compose
This is the most reliable method as it automatically handles all dependencies (PostgreSQL, Redis, Mailpit) and ensures the correct Python version (3.12).

**Run all tests:**
```bash
docker compose -f docker-compose.test.yml up --abort-on-container-exit
```

**Clean up after tests:**
```bash
docker compose -f docker-compose.test.yml down -v
```

---

## ⚠️ Troubleshooting Local Execution (`pytest` failures)

If you tried running `pytest` directly and got an error like:
> `ImportError: No module named 'celery'`

### The Cause
1.  **Missing Dependencies**: Your local Python environment is missing required packages listed in `pyproject.toml` (like `celery`).
2.  **Incompatible Python Version**: You are running **Python 3.13**, but this project explicitly requires **Python 3.12** (`requires-python = ">=3.12,<3.13"` in `pyproject.toml`).

### The Fix
Instead of trying to fix your local environment (which would require downgrading Python), **use the Docker Compose method above**. It uses a container with the correct Python version and all dependencies pre-installed.

---

## Alternative: Local Execution (Advanced)
If you *must* run locally, you need to:
1.  Install Python 3.12.
2.  Install `uv` (recommended) or use pip.
3.  Install dependencies:
    ```bash
    uv sync
    # OR
    pip install -e .[dev]
    ```
4.  Start local services (Postgres, Redis) manually.
5.  Then run pytest: `pytest saleor/order/tests/test_order_integration.py`
