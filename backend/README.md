# Flask backend

## Local setup

From the repository root:

```bash
python -m venv .venv
# Windows PowerShell: .venv\Scripts\Activate.ps1
# Linux/macOS: source .venv/bin/activate
pip install -r backend/requirements.txt
```

Copy `.env.example` to `.env` in the repository root and set `DATABASE_URL` to your local PostgreSQL connection string. Do not commit `.env`.

Start the development API from the repository root:

```bash
python -m backend.run
```

The starter exposes `GET /api/health`. The clinic search endpoints are described in `docs/api-contract.md` and are to be implemented by the backend member.
