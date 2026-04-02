# Project Guidelines

## Architecture
- This repo has two apps: a FastAPI backend in `backend/` and a React/Vite frontend in `frontend/`.
- Keep business logic in backend services, request/response shapes in schemas, persistence in models, and HTTP handlers in routes.
- Prefer linking to the source docs instead of restating them: [project_explanation.md](../project_explanation.md) and [backend/README.md](../backend/README.md).

## Build and Run
- Backend: from `backend/`, create a venv, install [backend/requirements.txt](../backend/requirements.txt), then run `uvicorn main:app --reload`.
- If the server is started from the repo root, use `uvicorn backend.main:app --reload`.
- Frontend: from `frontend/`, run `npm install`, `npm run dev`, `npm run build`, or `npm run preview` as needed.
- There are no project test commands yet; if you add tests, document the exact commands in the relevant package or README.

## Conventions
- Preserve the existing FastAPI and React component structure; avoid moving logic across layers unless the change clearly belongs there.
- Keep auth and role checks in the backend; the first registered user becomes `admin`, and later users default to `viewer`.
- The backend currently uses SQLite and JWT auth; keep `bcrypt==4.0.1` in [backend/requirements.txt](../backend/requirements.txt) to avoid Python 3.12 compatibility issues.
- Frontend auth state relies on localStorage and the API client attaches the bearer token automatically; preserve that flow unless you are intentionally changing auth behavior.
- CORS is configured for the local Vite dev server; update it if you change the frontend origin.

## Code Style
- Match the existing file’s style and naming conventions.
- Make focused changes and avoid unrelated refactors.
- Prefer small, explicit updates that preserve current APIs and UI behavior.
