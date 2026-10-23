# Contributing

1. Create a branch for your change.
2. Use Python 3.10 or newer.
3. Install development dependencies: `python -m pip install -e ".[dev]"`.
4. Run tests: `python -m pytest`.
5. Run lint: `ruff check .`.
6. Do not commit QR images, pairing passwords, device identifiers, or other credentials.
7. For behavior changes, add tests and update README usage instructions.
