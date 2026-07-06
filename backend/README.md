# Portfolio Admin Backend

Small FastAPI + SQLite service that powers the portfolio's admin dashboard:
categorized project management and editable profile copy, plus one-click
import from the linkedin-showcase project library.

## Setup

    pip install -r requirements.txt
    cp .env.example .env   # set ADMIN_PASSWORD and SECRET_KEY
    uvicorn main:app --reload --port 8002

## Frontend

The portfolio's Vite app reads `VITE_API_BASE` (default `http://localhost:8002`).
Visit `/admin` on the running site to log in and manage content.

## Importing from linkedin-showcase

Run linkedin-showcase's backend (`http://127.0.0.1:8000` by default, override
with `SHOWCASE_API_URL`). The admin Projects tab lists any showcase project
not yet imported; importing copies title/description/tech_stack/github_url
and the first media item as the image, sets category "Uncategorized" and
visibility "Draft" — edit both before it appears on the public site.

## API

Public (no auth): `GET /profile`, `GET /projects`
Admin (session cookie): `POST /admin/login`, `POST /admin/logout`,
`GET /admin/whoami`, `GET /admin/projects`, `POST/PUT/DELETE /admin/projects[/{id}]`,
`PUT /admin/profile`, `GET /admin/showcase-importable`,
`POST /admin/projects/import/{showcase_id}`
