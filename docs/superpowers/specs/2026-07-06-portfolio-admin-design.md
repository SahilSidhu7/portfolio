# Portfolio Admin Dashboard — Design Spec

Date: 2026-07-06
Goal: replace the portfolio's hardcoded project/profile data with a small admin-managed backend, so projects can be added/edited/categorized without touching code, and projects already built via the linkedin-showcase tool can be pulled in with one click.

## Context

Portfolio (`C:/Portfolio/portfolio/`) is currently a pure static site: React 19 + Vite, deployed to Cloudflare, data hardcoded in JSX (`Projects.jsx` PROJECTS array, `skills.jsx` groups, `About.jsx`/`AboutIntro.jsx` bio text). It already depends on one always-running backend service (the RAG chatbot, `chatbot/`), so adding a second small backend follows an existing pattern rather than introducing a new one.

linkedin-showcase (`C:/Portfolio/linkedin-showcase/`, port 8000) already has a complete project record: title, description, tech_stack (JSON list), github_url, media (JSON list), caption, hashtags, timestamps — via a tested FastAPI + sqlite3 API (24 passing tests, no auth, CORS open to localhost:5173 only currently).

## Decisions

- **Backend**: new `portfolio/backend/`, FastAPI + stdlib `sqlite3` (matches linkedin-showcase/job-hunt pattern — no ORM), port **8002**.
- **Admin auth**: single shared password via `ADMIN_PASSWORD` env var. `POST /admin/login` compares it, sets a signed HttpOnly session cookie (`itsdangerous` for signing — stdlib-adjacent, already a FastAPI transitive dep). All `/admin/*` write routes require a valid cookie via a FastAPI dependency.
- **Data model**:
  - `profile` — single row (id=1), JSON blob column, auto-seeded from current hardcoded content on first run. Fields: `hero_tagline`, `hero_headline`, `hero_subtext`, `bio_paragraphs` (list), `currently_building` (list of strings), `social_links` (github/linkedin/email).
  - `projects` — id, title, description, category (`AI/ML` | `Web Dev` | `Automation`), tech_stack (JSON list), github_url, image_url, proof_line (the amber outcome line, e.g. "live on this site"), featured (bool, default true), source (`manual` | `linkedin-showcase`, default `manual`), source_id (nullable int, the showcase project's id — dedup key), created_at, updated_at.
- **Public API** (no auth): `GET /profile`, `GET /projects` (optional `?category=` filter, but small volume expected — frontend can filter client-side after one fetch).
- **Admin API** (cookie-gated): `POST /admin/login`, `POST /admin/logout`, full CRUD on `/admin/projects` and `/admin/profile`, plus:
  - `GET /admin/showcase-importable` — calls linkedin-showcase's `GET http://127.0.0.1:8000/projects` (base URL from `SHOWCASE_API_URL` env var), filters out projects whose id already appears as a `source_id` in the local `projects` table, returns the rest.
  - `POST /admin/projects/import/{showcase_project_id}` — re-fetches that one project from linkedin-showcase (`GET /projects/{id}`), maps `title/description/tech_stack/github_url` in, takes the first `media` entry (if any) as `image_url`, sets `category="Uncategorized"`, `source="linkedin-showcase"`, `source_id=showcase_project_id`. If linkedin-showcase's backend isn't running, return 502 with a clear message — no silent failure.
- **Admin panel**: same Vite app, no router library added. `App.jsx` checks `window.location.pathname === '/admin'` and renders an `AdminApp` component tree instead of the public site. `AdminApp` has its own tiny internal view-switching (login / projects / profile) via `useState`, matching the existing no-router convention.
  - Login screen: password field, posts to `/admin/login`, redirects into the dashboard on success, shows an inline error on failure (no hint whether the password format is wrong vs. incorrect — just "Incorrect password").
  - Projects tab: table (title, category, source badge, edit/delete buttons), "Add project" form (all fields, category as a select), "Import from LinkedIn Showcase" panel listing importable projects with a one-click Import button per row; imported projects appear in the table immediately with category "Uncategorized" so they're visibly incomplete until edited.
  - Profile tab: text inputs/textareas for every profile field, one "Save" button — same interaction pattern as job-hunt's `Profile.jsx`.
- **Public site changes**:
  - `Projects.jsx`: fetches `GET /projects` on mount instead of importing the hardcoded array; renders category tabs (All / AI-ML / Web Dev / Automation) above the list, filtering client-side; "Load more" button removed (tabs replace it as the primary navigation, and volume is small enough not to need pagination).
  - `Hero.jsx` / `AboutIntro.jsx`: tagline/headline/subtext/bio/currently-building pull from `GET /profile` instead of literal JSX strings. The credentials `.eval` card and Skills/Certificates sections stay exactly as they are (out of scope, see below).
  - `api.js` module added (mirrors linkedin-showcase/job-hunt convention): exported functions per endpoint, `BASE_URL` from `import.meta.env.VITE_API_BASE`, default `http://127.0.0.1:8002`.
- **Loading/error states**: public site shows a lightweight loading placeholder while `/profile` and `/projects` load, and falls back to nothing broken (empty state, not a crash) if the backend is unreachable — the rest of the static page (nav, skills, certificates, footer) must still render even if the backend is down, since Cloudflare serves the static shell regardless of backend uptime.

## Testing

pytest backend suite (auth required/rejected, project CRUD, profile CRUD, showcase-importable filtering with a mocked httpx client, import mapping, dedup-by-source_id). No JS test framework in this repo (matches existing precedent) — verification is `npm run build` + manual browser check of both the public site and `/admin`, plus a live check of the import flow against a running linkedin-showcase instance.

## Out of scope

Skills list and Certificates section stay hardcoded (unchanged from the recent redesign). No image upload — `image_url` stays a plain URL field. No multi-user auth/roles. No two-way sync back to linkedin-showcase (import is one-directional, one-time per project). No pagination (volume is small). Production domain/hosting for the new backend is the user's deployment decision, not designed here — `VITE_API_BASE` makes it a one-line config change whenever that's decided.
