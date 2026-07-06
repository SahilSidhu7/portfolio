# Portfolio Admin Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the portfolio's hardcoded project/profile data with a small admin-managed backend (FastAPI + sqlite3), so projects can be added/edited/categorized without touching code, and projects built via linkedin-showcase can be imported with one click.

**Architecture:** New `portfolio/backend/` (port 8002) owns two tables — `profile` (single JSON-blob row) and `projects` (categorized, with an import-dedup key). Public routes are unauthenticated; `/admin/*` routes require a signed session cookie. The admin panel is a path-checked view (`pathname === '/admin'`) in the existing no-router React app. Public components (`Projects.jsx`, `Hero.jsx`, `AboutIntro.jsx`) switch from hardcoded arrays to `fetch` calls, with static fallbacks so the page never breaks if the backend is down.

**Tech Stack:** FastAPI, stdlib `sqlite3`, `itsdangerous` (session signing), `httpx` (calls to linkedin-showcase's API), pytest. Frontend: React 19, Tailwind v4 (existing `ink & signal` theme tokens: `bg-panel`, `border-line`, `text-snow`, `text-fog`, `bg-iris`, `text-signal`), no new JS deps.

## Global Constraints

- Backend working directory: `C:/Portfolio/portfolio/backend/`. Run tests with `python -m pytest tests/ -v` from that directory.
- Frontend working directory: `C:/Portfolio/portfolio/`. Build with `npm run build`.
- Backend port: **8002** (8000 = linkedin-showcase, 8001 = job-hunt).
- Env vars (defaults in code): `PORTFOLIO_DB_PATH=portfolio.db`, `ADMIN_PASSWORD` (no default — must be set, see Task 4), `SECRET_KEY=dev-secret-change-me`, `SHOWCASE_API_URL=http://127.0.0.1:8000`, `ADMIN_CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173`.
- Frontend env: `VITE_API_BASE`, default `http://127.0.0.1:8002` (in `api.js`, not `.env` — matches job-hunt/linkedin-showcase convention of a literal default).
- Categories, exact strings: `"AI/ML"`, `"Web Dev"`, `"Automation"`, `"Uncategorized"` (import default).
- `featured` field is the publish flag: `true` = shown on public `GET /projects`; `false` = draft, visible only via admin's `GET /admin/projects`. Imports default `featured=False`.
- No JS test framework in this repo. Frontend tasks are verified by `npm run build` + a manual/live browser check — this is consistent with the existing codebase, not a shortcut.
- Every commit trailer:
```
Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01CmSPxtLLYJPz6XcbVmYrx6
```

---

### Task 1: Backend — db.py (profile + projects schema, CRUD, seeding)

**Files:**
- Create: `backend/db.py`
- Test: `backend/tests/test_db.py`
- Create (empty, for pytest import path): `backend/tests/__init__.py`, `backend/conftest.py`

**Interfaces:**
- Produces: `init_db(db_path)`, `get_profile(db_path) -> dict`, `save_profile(data: dict, db_path) -> dict`, `list_projects(db_path, featured_only: bool = False) -> list[dict]`, `get_project(project_id: int, db_path) -> dict | None`, `create_project(data: dict, db_path) -> dict`, `update_project(project_id: int, data: dict, db_path) -> dict | None`, `delete_project(project_id: int, db_path) -> bool`, `get_source_ids(db_path) -> set[int]`.
- Project dict shape: `id, title, description, category, tech_stack (list), github_url, image_url, proof_line, featured (bool), source, source_id (int|None), created_at, updated_at`.

- [ ] **Step 1: Write `backend/conftest.py` and `backend/tests/__init__.py`**

```python
# backend/conftest.py
import sys
import pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
```

```python
# backend/tests/__init__.py
```
(empty file)

- [ ] **Step 2: Write the failing tests**

```python
# backend/tests/test_db.py
import db


def test_init_db_seeds_default_profile(tmp_path):
    path = str(tmp_path / "test.db")
    db.init_db(path)
    profile = db.get_profile(path)
    assert profile["hero_tagline"] == "AI & full-stack developer"
    assert isinstance(profile["bio_paragraphs"], list)
    assert profile["social_links"]["email"] == "sahilsidhu3127@gmail.com"


def test_save_profile_persists_changes(tmp_path):
    path = str(tmp_path / "test.db")
    db.init_db(path)
    profile = db.get_profile(path)
    profile["hero_tagline"] = "Changed tagline"
    saved = db.save_profile(profile, path)
    assert saved["hero_tagline"] == "Changed tagline"
    assert db.get_profile(path)["hero_tagline"] == "Changed tagline"


def test_init_db_seeds_default_projects(tmp_path):
    path = str(tmp_path / "test.db")
    db.init_db(path)
    projects = db.list_projects(path)
    assert len(projects) == 7
    assert all(p["category"] in {"AI/ML", "Web Dev", "Automation"} for p in projects)


def test_create_and_get_project(tmp_path):
    path = str(tmp_path / "test.db")
    db.init_db(path)
    new_id = db.create_project(
        {
            "title": "Test Project",
            "description": "A test.",
            "category": "AI/ML",
            "tech_stack": ["Python"],
            "github_url": "https://github.com/x/y",
            "image_url": "",
            "proof_line": "",
            "featured": True,
            "source": "manual",
            "source_id": None,
        },
        path,
    )["id"]
    project = db.get_project(new_id, path)
    assert project["title"] == "Test Project"
    assert project["tech_stack"] == ["Python"]
    assert project["source_id"] is None


def test_update_project_returns_none_when_missing(tmp_path):
    path = str(tmp_path / "test.db")
    db.init_db(path)
    result = db.update_project(9999, {"title": "x"}, path)
    assert result is None


def test_update_project_changes_fields(tmp_path):
    path = str(tmp_path / "test.db")
    db.init_db(path)
    created = db.create_project(
        {
            "title": "Old", "description": "d", "category": "Web Dev",
            "tech_stack": [], "github_url": "", "image_url": "", "proof_line": "",
            "featured": True, "source": "manual", "source_id": None,
        },
        path,
    )
    updated = db.update_project(created["id"], {**created, "title": "New"}, path)
    assert updated["title"] == "New"


def test_delete_project(tmp_path):
    path = str(tmp_path / "test.db")
    db.init_db(path)
    created = db.create_project(
        {
            "title": "Gone", "description": "d", "category": "Web Dev",
            "tech_stack": [], "github_url": "", "image_url": "", "proof_line": "",
            "featured": True, "source": "manual", "source_id": None,
        },
        path,
    )
    assert db.delete_project(created["id"], path) is True
    assert db.get_project(created["id"], path) is None
    assert db.delete_project(created["id"], path) is False


def test_list_projects_featured_only(tmp_path):
    path = str(tmp_path / "test.db")
    db.init_db(path)
    db.create_project(
        {
            "title": "Draft", "description": "d", "category": "Uncategorized",
            "tech_stack": [], "github_url": "", "image_url": "", "proof_line": "",
            "featured": False, "source": "linkedin-showcase", "source_id": 5,
        },
        path,
    )
    all_projects = db.list_projects(path, featured_only=False)
    featured = db.list_projects(path, featured_only=True)
    assert len(all_projects) == 8
    assert len(featured) == 7
    assert all(p["featured"] for p in featured)


def test_get_source_ids(tmp_path):
    path = str(tmp_path / "test.db")
    db.init_db(path)
    db.create_project(
        {
            "title": "Imported", "description": "d", "category": "Uncategorized",
            "tech_stack": [], "github_url": "", "image_url": "", "proof_line": "",
            "featured": False, "source": "linkedin-showcase", "source_id": 3,
        },
        path,
    )
    assert db.get_source_ids(path) == {3}
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd C:/Portfolio/portfolio/backend && python -m pytest tests/test_db.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'db'`

- [ ] **Step 4: Write `backend/db.py`**

```python
# backend/db.py
import json
import sqlite3
from datetime import datetime, timezone

DEFAULT_DB_PATH = "portfolio.db"

DEFAULT_PROFILE = {
    "hero_tagline": "AI & full-stack developer",
    "hero_headline": "Real AI systems, built end to end.",
    "hero_subtext": (
        "CS undergrad who ships RAG pipelines, local-LLM apps, and full-stack "
        "tools — running on real hardware, not just in notebooks."
    ),
    "bio_paragraphs": [
        "I'm a computer science student at Chitkara University (B.Tech, 2028). "
        "Instead of collecting tutorials, I build complete systems: scrape the "
        "data, build the pipeline, serve the API, design the frontend, and put "
        "it on a real server behind Cloudflare.",
        "Most of my work runs local LLMs with Ollama — RAG pipelines over "
        "FAISS, automation workflows in n8n, and FastAPI backends with React "
        "frontends. The chatbot on this page is one of them.",
    ],
    "currently_building": [
        "Building Cricket AI Assistant — RAG Q&A over cricket stats",
        "B.Tech CS @ Chitkara University · class of 2028",
        "Open to software / AI engineering internships",
    ],
    "social_links": {
        "github": "https://github.com/SahilSidhu7",
        "linkedin": "https://www.linkedin.com/in/sahil-sidhu-ai/",
        "email": "sahilsidhu3127@gmail.com",
    },
}

DEFAULT_PROJECTS = [
    {
        "title": "AI Website Chatbot",
        "description": (
            "A Retrieval-Augmented Generation pipeline that scrapes any website, "
            "chunks and embeds its content into a FAISS index, and answers "
            "questions grounded in that content through a floating chat widget."
        ),
        "category": "AI/ML",
        "tech_stack": ["Python", "FastAPI", "FAISS", "Ollama", "RAG", "React"],
        "github_url": "https://github.com/SahilSidhu7/ai-website-chatbot",
        "image_url": "https://github.com/SahilSidhu7/ai-website-chatbot/blob/main/screenshots/chatthinking.png?raw=true",
        "proof_line": "live on this site — bottom-right corner",
        "featured": True,
        "source": "manual",
        "source_id": None,
    },
    {
        "title": "AI Lead Generation Dashboard",
        "description": (
            "Scrapes target websites, extracts contact info, and uses a "
            "locally-run Phi-3 model to analyze each business and draft a "
            "personalized outreach email."
        ),
        "category": "AI/ML",
        "tech_stack": ["Python", "FastAPI", "React", "Ollama (Phi-3)"],
        "github_url": "https://github.com/SahilSidhu7/AI-Lead-Generator",
        "image_url": "https://github.com/SahilSidhu7/AI-Lead-Generator/blob/main/screenshots/UIDashboard.png?raw=true",
        "proof_line": "full pipeline: scrape → analyze → outreach draft",
        "featured": True,
        "source": "manual",
        "source_id": None,
    },
    {
        "title": "Job Hunt Tracker",
        "description": (
            "Searches the open web for jobs and internships via DuckDuckGo, "
            "scores every listing against my skills, generates tailored cover "
            "letters, and tracks each application through the pipeline."
        ),
        "category": "Automation",
        "tech_stack": ["Python", "FastAPI", "SQLite", "React", "pytest"],
        "github_url": "",
        "image_url": "",
        "proof_line": "built test-first · 37 passing tests",
        "featured": True,
        "source": "manual",
        "source_id": None,
    },
    {
        "title": "LinkedIn Showcase Generator",
        "description": (
            "Paste a GitHub repo link and it builds a LinkedIn-ready showcase "
            "post: pulls the README, detects the tech stack, collects demo "
            "media, and generates the caption."
        ),
        "category": "Automation",
        "tech_stack": ["Python", "FastAPI", "GitHub API", "React", "pytest"],
        "github_url": "",
        "image_url": "",
        "proof_line": "built test-first · 24 passing tests",
        "featured": True,
        "source": "manual",
        "source_id": None,
    },
    {
        "title": "AI Email Assistant",
        "description": (
            "An n8n automation workflow that watches a Gmail inbox, summarizes "
            "incoming email with a local LLM, and drafts a suggested reply."
        ),
        "category": "Automation",
        "tech_stack": ["n8n", "Ollama", "Gmail API"],
        "github_url": "https://github.com/SahilSidhu7/AI-Email-Assistant-Automation",
        "image_url": "https://github.com/SahilSidhu7/AI-Email-Assistant-Automation/blob/main/Screenshots/telegram.png?raw=true",
        "proof_line": "runs unattended on a home server",
        "featured": True,
        "source": "manual",
        "source_id": None,
    },
    {
        "title": "AI Search Assistant",
        "description": (
            "A mobile search assistant that retrieves information from "
            "multiple sources and composes contextual answers with a local LLM."
        ),
        "category": "AI/ML",
        "tech_stack": ["React Native", "TypeScript", "LLM"],
        "github_url": "https://github.com/SahilSidhu7/AI-Search_Assistant",
        "image_url": "https://github.com/SahilSidhu7/AI-Search_Assistant/blob/main/Screenshots/image2.png?raw=true",
        "proof_line": "mobile-first, React Native + TypeScript",
        "featured": True,
        "source": "manual",
        "source_id": None,
    },
    {
        "title": "Learn Flow Coder",
        "description": (
            "A personal learning environment for structured coding practice "
            "— algorithms, patterns, and exercises tracked in a TypeScript "
            "app backed by Supabase."
        ),
        "category": "Web Dev",
        "tech_stack": ["TypeScript", "Supabase"],
        "github_url": "https://github.com/SahilSidhu7/learn-flow-coder",
        "image_url": "https://github.com/SahilSidhu7/learn-flow-coder/blob/main/screenshots/mainpage.png?raw=true",
        "proof_line": "daily-driver for my own practice",
        "featured": True,
        "source": "manual",
        "source_id": None,
    },
]


def init_db(db_path: str = DEFAULT_DB_PATH) -> None:
    conn = sqlite3.connect(db_path)
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS profile (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            data TEXT NOT NULL
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            category TEXT NOT NULL,
            tech_stack TEXT NOT NULL,
            github_url TEXT NOT NULL,
            image_url TEXT NOT NULL,
            proof_line TEXT NOT NULL,
            featured INTEGER NOT NULL DEFAULT 1,
            source TEXT NOT NULL DEFAULT 'manual',
            source_id INTEGER,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
        """
    )
    conn.commit()

    row = conn.execute("SELECT 1 FROM profile WHERE id = 1").fetchone()
    if row is None:
        conn.execute(
            "INSERT INTO profile (id, data) VALUES (1, ?)",
            (json.dumps(DEFAULT_PROFILE),),
        )
        conn.commit()

    count = conn.execute("SELECT COUNT(*) FROM projects").fetchone()[0]
    conn.close()
    if count == 0:
        for project in DEFAULT_PROJECTS:
            create_project(project, db_path)


def get_profile(db_path: str = DEFAULT_DB_PATH) -> dict:
    conn = sqlite3.connect(db_path)
    row = conn.execute("SELECT data FROM profile WHERE id = 1").fetchone()
    conn.close()
    return json.loads(row[0])


def save_profile(data: dict, db_path: str = DEFAULT_DB_PATH) -> dict:
    conn = sqlite3.connect(db_path)
    conn.execute(
        "UPDATE profile SET data = ? WHERE id = 1",
        (json.dumps(data),),
    )
    conn.commit()
    conn.close()
    return data


def _row_to_project(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "title": row["title"],
        "description": row["description"],
        "category": row["category"],
        "tech_stack": json.loads(row["tech_stack"]),
        "github_url": row["github_url"],
        "image_url": row["image_url"],
        "proof_line": row["proof_line"],
        "featured": bool(row["featured"]),
        "source": row["source"],
        "source_id": row["source_id"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def list_projects(db_path: str = DEFAULT_DB_PATH, featured_only: bool = False) -> list:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    query = "SELECT * FROM projects"
    if featured_only:
        query += " WHERE featured = 1"
    query += " ORDER BY featured DESC, created_at DESC, id DESC"
    rows = conn.execute(query).fetchall()
    conn.close()
    return [_row_to_project(row) for row in rows]


def get_project(project_id: int, db_path: str = DEFAULT_DB_PATH):
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    row = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    conn.close()
    return _row_to_project(row) if row else None


def create_project(data: dict, db_path: str = DEFAULT_DB_PATH) -> dict:
    now = datetime.now(timezone.utc).isoformat()
    conn = sqlite3.connect(db_path)
    cursor = conn.execute(
        """
        INSERT INTO projects
            (title, description, category, tech_stack, github_url, image_url,
             proof_line, featured, source, source_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            data["title"],
            data["description"],
            data["category"],
            json.dumps(data["tech_stack"]),
            data["github_url"],
            data["image_url"],
            data["proof_line"],
            1 if data["featured"] else 0,
            data["source"],
            data["source_id"],
            now,
            now,
        ),
    )
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return get_project(new_id, db_path)


def update_project(project_id: int, data: dict, db_path: str = DEFAULT_DB_PATH):
    now = datetime.now(timezone.utc).isoformat()
    conn = sqlite3.connect(db_path)
    cursor = conn.execute(
        """
        UPDATE projects
        SET title = ?, description = ?, category = ?, tech_stack = ?,
            github_url = ?, image_url = ?, proof_line = ?, featured = ?,
            updated_at = ?
        WHERE id = ?
        """,
        (
            data["title"],
            data["description"],
            data["category"],
            json.dumps(data["tech_stack"]),
            data["github_url"],
            data["image_url"],
            data["proof_line"],
            1 if data["featured"] else 0,
            now,
            project_id,
        ),
    )
    conn.commit()
    updated = cursor.rowcount > 0
    conn.close()
    return get_project(project_id, db_path) if updated else None


def delete_project(project_id: int, db_path: str = DEFAULT_DB_PATH) -> bool:
    conn = sqlite3.connect(db_path)
    cursor = conn.execute("DELETE FROM projects WHERE id = ?", (project_id,))
    conn.commit()
    deleted = cursor.rowcount > 0
    conn.close()
    return deleted


def get_source_ids(db_path: str = DEFAULT_DB_PATH) -> set:
    conn = sqlite3.connect(db_path)
    rows = conn.execute(
        "SELECT source_id FROM projects WHERE source_id IS NOT NULL"
    ).fetchall()
    conn.close()
    return {row[0] for row in rows}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `python -m pytest tests/test_db.py -v`
Expected: 9 passed

- [ ] **Step 6: Commit**

```bash
cd C:/Portfolio/portfolio && git add backend/db.py backend/conftest.py backend/tests/__init__.py backend/tests/test_db.py
git commit -m "feat(portfolio-backend): profile + projects schema with CRUD and seeding

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01CmSPxtLLYJPz6XcbVmYrx6"
```

---

### Task 2: Backend — auth.py (password check + session token)

**Files:**
- Create: `backend/auth.py`
- Test: `backend/tests/test_auth.py`

**Interfaces:**
- Produces: `check_password(password: str, expected: str | None = None) -> bool`; `create_session_token(secret: str = SECRET_KEY) -> str`; `verify_session_token(token: str | None, secret: str = SECRET_KEY, max_age: int = SESSION_MAX_AGE) -> bool`; module constants `SECRET_KEY`, `SESSION_MAX_AGE`.

- [ ] **Step 1: Write the failing tests**

```python
# backend/tests/test_auth.py
import time
import auth


def test_check_password_matches_expected():
    assert auth.check_password("hunter2", expected="hunter2") is True
    assert auth.check_password("wrong", expected="hunter2") is False


def test_check_password_rejects_when_no_expected_configured():
    assert auth.check_password("anything", expected="") is False
    assert auth.check_password("anything", expected=None) is False


def test_session_token_round_trip():
    token = auth.create_session_token(secret="test-secret")
    assert auth.verify_session_token(token, secret="test-secret") is True


def test_session_token_rejects_wrong_secret():
    token = auth.create_session_token(secret="test-secret")
    assert auth.verify_session_token(token, secret="different-secret") is False


def test_session_token_rejects_missing_or_garbage():
    assert auth.verify_session_token(None, secret="test-secret") is False
    assert auth.verify_session_token("not-a-real-token", secret="test-secret") is False


def test_session_token_expires(monkeypatch):
    token = auth.create_session_token(secret="test-secret")
    assert auth.verify_session_token(token, secret="test-secret", max_age=0) is False
    time.sleep(1.1)
    assert auth.verify_session_token(token, secret="test-secret", max_age=1) is False
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `python -m pytest tests/test_auth.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'auth'`

- [ ] **Step 3: Install itsdangerous and implement**

Run: `pip install itsdangerous`

```python
# backend/auth.py
import os

from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")
SESSION_MAX_AGE = 60 * 60 * 24 * 7  # 7 days
SESSION_COOKIE_NAME = "admin_session"


def check_password(password: str, expected: str | None = None) -> bool:
    expected = expected if expected is not None else os.getenv("ADMIN_PASSWORD", "")
    return bool(expected) and password == expected


def create_session_token(secret: str = SECRET_KEY) -> str:
    return URLSafeTimedSerializer(secret).dumps({"admin": True})


def verify_session_token(
    token: str | None, secret: str = SECRET_KEY, max_age: int = SESSION_MAX_AGE
) -> bool:
    if not token:
        return False
    try:
        data = URLSafeTimedSerializer(secret).loads(token, max_age=max_age)
    except (BadSignature, SignatureExpired):
        return False
    return data.get("admin") is True
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `python -m pytest tests/test_auth.py -v`
Expected: 6 passed (the expiry test takes ~1.1s)

- [ ] **Step 5: Commit**

```bash
cd C:/Portfolio/portfolio && git add backend/auth.py backend/tests/test_auth.py
git commit -m "feat(portfolio-backend): password check + signed session tokens

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01CmSPxtLLYJPz6XcbVmYrx6"
```

---

### Task 3: Backend — showcase_client.py (import from linkedin-showcase)

**Files:**
- Create: `backend/showcase_client.py`
- Test: `backend/tests/test_showcase_client.py`

**Interfaces:**
- Consumes: nothing from earlier tasks (standalone HTTP client module).
- Produces: `fetch_projects(base_url=None, get_fn=httpx.get) -> list[dict]`; `fetch_project(project_id: int, base_url=None, get_fn=httpx.get) -> dict`; `map_to_portfolio_project(showcase_project: dict) -> dict`; `list_importable(local_source_ids: set, base_url=None, get_fn=httpx.get) -> list[dict]`; module constant `SHOWCASE_API_URL`.

- [ ] **Step 1: Write the failing tests**

```python
# backend/tests/test_showcase_client.py
import httpx
import pytest
import showcase_client


class FakeResponse:
    def __init__(self, data, status=200):
        self._data = data
        self.status_code = status

    def raise_for_status(self):
        if self.status_code >= 400:
            raise httpx.HTTPStatusError("error", request=None, response=self)

    def json(self):
        return self._data


SHOWCASE_PROJECT = {
    "id": 7,
    "github_url": "https://github.com/x/y",
    "repo_name": "y",
    "title": "Cool Project",
    "description": "Does cool things.",
    "tech_stack": ["Python", "FastAPI"],
    "hashtags": ["#python"],
    "caption": "Check this out!",
    "media": ["https://example.com/screenshot.png"],
    "created_at": "2026-01-01T00:00:00+00:00",
    "updated_at": "2026-01-01T00:00:00+00:00",
}


def test_fetch_projects_calls_showcase_api():
    calls = {}

    def fake_get(url, timeout=None):
        calls["url"] = url
        return FakeResponse([SHOWCASE_PROJECT])

    result = showcase_client.fetch_projects(base_url="http://x:8000", get_fn=fake_get)
    assert calls["url"] == "http://x:8000/projects"
    assert result == [SHOWCASE_PROJECT]


def test_fetch_project_calls_single_endpoint():
    calls = {}

    def fake_get(url, timeout=None):
        calls["url"] = url
        return FakeResponse(SHOWCASE_PROJECT)

    result = showcase_client.fetch_project(7, base_url="http://x:8000", get_fn=fake_get)
    assert calls["url"] == "http://x:8000/projects/7"
    assert result["title"] == "Cool Project"


def test_fetch_projects_raises_on_error():
    def fake_get(url, timeout=None):
        return FakeResponse({}, status=502)

    with pytest.raises(httpx.HTTPStatusError):
        showcase_client.fetch_projects(base_url="http://x:8000", get_fn=fake_get)


def test_map_to_portfolio_project():
    mapped = showcase_client.map_to_portfolio_project(SHOWCASE_PROJECT)
    assert mapped["title"] == "Cool Project"
    assert mapped["description"] == "Does cool things."
    assert mapped["category"] == "Uncategorized"
    assert mapped["tech_stack"] == ["Python", "FastAPI"]
    assert mapped["github_url"] == "https://github.com/x/y"
    assert mapped["image_url"] == "https://example.com/screenshot.png"
    assert mapped["featured"] is False
    assert mapped["source"] == "linkedin-showcase"
    assert mapped["source_id"] == 7


def test_map_to_portfolio_project_no_media():
    project = {**SHOWCASE_PROJECT, "media": []}
    mapped = showcase_client.map_to_portfolio_project(project)
    assert mapped["image_url"] == ""


def test_list_importable_filters_known_source_ids():
    def fake_get(url, timeout=None):
        return FakeResponse([SHOWCASE_PROJECT, {**SHOWCASE_PROJECT, "id": 8}])

    result = showcase_client.list_importable({7}, base_url="http://x:8000", get_fn=fake_get)
    assert [p["id"] for p in result] == [8]
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `python -m pytest tests/test_showcase_client.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'showcase_client'`

- [ ] **Step 3: Install httpx and implement**

Run: `pip install httpx`

```python
# backend/showcase_client.py
import os

import httpx

SHOWCASE_API_URL = os.getenv("SHOWCASE_API_URL", "http://127.0.0.1:8000")


def fetch_projects(base_url: str | None = None, get_fn=httpx.get) -> list:
    resp = get_fn(f"{base_url or SHOWCASE_API_URL}/projects", timeout=10.0)
    resp.raise_for_status()
    return resp.json()


def fetch_project(project_id: int, base_url: str | None = None, get_fn=httpx.get) -> dict:
    resp = get_fn(f"{base_url or SHOWCASE_API_URL}/projects/{project_id}", timeout=10.0)
    resp.raise_for_status()
    return resp.json()


def map_to_portfolio_project(showcase_project: dict) -> dict:
    media = showcase_project.get("media") or []
    return {
        "title": showcase_project["title"],
        "description": showcase_project["description"],
        "category": "Uncategorized",
        "tech_stack": showcase_project["tech_stack"],
        "github_url": showcase_project["github_url"],
        "image_url": media[0] if media else "",
        "proof_line": "",
        "featured": False,
        "source": "linkedin-showcase",
        "source_id": showcase_project["id"],
    }


def list_importable(
    local_source_ids: set, base_url: str | None = None, get_fn=httpx.get
) -> list:
    projects = fetch_projects(base_url, get_fn)
    return [p for p in projects if p["id"] not in local_source_ids]
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `python -m pytest tests/test_showcase_client.py -v`
Expected: 6 passed

- [ ] **Step 5: Commit**

```bash
cd C:/Portfolio/portfolio && git add backend/showcase_client.py backend/tests/test_showcase_client.py
git commit -m "feat(portfolio-backend): linkedin-showcase import client with dedup filtering

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01CmSPxtLLYJPz6XcbVmYrx6"
```

---

### Task 4: Backend — main.py (wire the API), requirements.txt

**Files:**
- Create: `backend/main.py`, `backend/requirements.txt`, `backend/.env.example`
- Test: `backend/tests/test_main.py`

**Interfaces:**
- Consumes: `db.*` (Task 1), `auth.*` (Task 2), `showcase_client.*` (Task 3).
- Produces: FastAPI app with routes — `GET /health`, `GET /profile`, `PUT /admin/profile`, `GET /projects`, `GET /admin/projects`, `POST /admin/projects`, `PUT /admin/projects/{id}`, `DELETE /admin/projects/{id}`, `GET /admin/showcase-importable`, `POST /admin/projects/import/{showcase_id}`, `POST /admin/login`, `POST /admin/logout`, `GET /admin/whoami`.

- [ ] **Step 1: Write the failing tests**

```python
# backend/tests/test_main.py
import os

import auth
import db
import main
from fastapi.testclient import TestClient

client = TestClient(main.app)


def setup_function():
    os.environ["PORTFOLIO_DB_PATH"] = "test_main.db"
    os.environ["ADMIN_PASSWORD"] = "test-password-123"
    if os.path.exists("test_main.db"):
        os.remove("test_main.db")


def teardown_function():
    if os.path.exists("test_main.db"):
        os.remove("test_main.db")


def test_health():
    assert client.get("/health").json() == {"status": "ok"}


def test_public_profile_and_projects_readable_without_auth():
    assert client.get("/profile").status_code == 200
    resp = client.get("/projects")
    assert resp.status_code == 200
    assert all(p["featured"] for p in resp.json())


def test_admin_routes_reject_without_login():
    assert client.put("/admin/profile", json={}).status_code == 401
    assert client.get("/admin/projects").status_code == 401
    assert client.get("/admin/whoami").status_code == 401


def test_login_wrong_password_rejected():
    resp = client.post("/admin/login", json={"password": "nope"})
    assert resp.status_code == 401


def test_login_success_enables_admin_routes():
    login_resp = client.post("/admin/login", json={"password": "test-password-123"})
    assert login_resp.status_code == 200
    assert client.get("/admin/whoami").status_code == 200
    assert client.get("/admin/projects").status_code == 200


def test_logout_revokes_access():
    client.post("/admin/login", json={"password": "test-password-123"})
    assert client.get("/admin/whoami").status_code == 200
    client.post("/admin/logout")
    assert client.get("/admin/whoami").status_code == 401


def test_admin_project_crud_round_trip():
    client.post("/admin/login", json={"password": "test-password-123"})
    payload = {
        "title": "New Project", "description": "desc", "category": "AI/ML",
        "tech_stack": ["Python"], "github_url": "https://x", "image_url": "",
        "proof_line": "", "featured": True, "source": "manual", "source_id": None,
    }
    created = client.post("/admin/projects", json=payload).json()
    assert created["title"] == "New Project"

    updated = client.put(f"/admin/projects/{created['id']}", json={**payload, "title": "Renamed"})
    assert updated.json()["title"] == "Renamed"

    deleted = client.delete(f"/admin/projects/{created['id']}")
    assert deleted.json() == {"deleted": True}
    assert client.delete(f"/admin/projects/{created['id']}").status_code == 404


def test_admin_profile_update():
    client.post("/admin/login", json={"password": "test-password-123"})
    profile = client.get("/profile").json()
    profile["hero_tagline"] = "Updated tagline"
    resp = client.put("/admin/profile", json=profile)
    assert resp.json()["hero_tagline"] == "Updated tagline"
    assert client.get("/profile").json()["hero_tagline"] == "Updated tagline"


def test_showcase_importable_and_import_flow(monkeypatch):
    client.post("/admin/login", json={"password": "test-password-123"})

    def fake_get(url, timeout=None):
        class R:
            def raise_for_status(self_inner):
                pass

            def json(self_inner):
                if url.endswith("/projects"):
                    return [{
                        "id": 42, "github_url": "https://github.com/a/b", "repo_name": "b",
                        "title": "Showcase Project", "description": "d",
                        "tech_stack": ["Python"], "hashtags": [], "caption": "c",
                        "media": [], "created_at": "now", "updated_at": "now",
                    }]
                return {
                    "id": 42, "github_url": "https://github.com/a/b", "repo_name": "b",
                    "title": "Showcase Project", "description": "d",
                    "tech_stack": ["Python"], "hashtags": [], "caption": "c",
                    "media": [], "created_at": "now", "updated_at": "now",
                }
        return R()

    monkeypatch.setattr(main.showcase_client, "fetch_projects", lambda **k: fake_get("x/projects").json())
    monkeypatch.setattr(main.showcase_client, "fetch_project", lambda pid, **k: fake_get(f"x/projects/{pid}").json())

    importable = client.get("/admin/showcase-importable").json()
    assert any(p["id"] == 42 for p in importable)

    imported = client.post("/admin/projects/import/42")
    assert imported.status_code == 200
    body = imported.json()
    assert body["source"] == "linkedin-showcase"
    assert body["source_id"] == 42
    assert body["featured"] is False
    assert body["category"] == "Uncategorized"

    importable_after = client.get("/admin/showcase-importable").json()
    assert not any(p["id"] == 42 for p in importable_after)


def test_import_returns_502_when_showcase_unreachable(monkeypatch):
    client.post("/admin/login", json={"password": "test-password-123"})

    def raise_error(**k):
        import httpx
        raise httpx.ConnectError("connection refused")

    monkeypatch.setattr(main.showcase_client, "fetch_project", raise_error)
    resp = client.post("/admin/projects/import/999")
    assert resp.status_code == 502
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `python -m pytest tests/test_main.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'main'`

- [ ] **Step 3: Write `backend/main.py`**

```python
# backend/main.py
import os

import httpx
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import auth
import db
import showcase_client

app = FastAPI(title="Portfolio Admin API")

_cors_origins = os.getenv(
    "ADMIN_CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db_path() -> str:
    path = os.environ.get("PORTFOLIO_DB_PATH", db.DEFAULT_DB_PATH)
    db.init_db(path)
    return path


def require_admin(request: Request) -> None:
    token = request.cookies.get(auth.SESSION_COOKIE_NAME)
    if not auth.verify_session_token(token):
        raise HTTPException(status_code=401, detail="Not authenticated.")


@app.get("/health")
def health():
    return {"status": "ok"}


class LoginRequest(BaseModel):
    password: str


@app.post("/admin/login")
def login(payload: LoginRequest, response: Response):
    if not auth.check_password(payload.password):
        raise HTTPException(status_code=401, detail="Incorrect password.")
    token = auth.create_session_token()
    response.set_cookie(
        auth.SESSION_COOKIE_NAME,
        token,
        httponly=True,
        max_age=auth.SESSION_MAX_AGE,
        samesite="lax",
    )
    return {"ok": True}


@app.post("/admin/logout")
def logout(response: Response):
    response.delete_cookie(auth.SESSION_COOKIE_NAME)
    return {"ok": True}


@app.get("/admin/whoami")
def whoami(request: Request):
    require_admin(request)
    return {"ok": True}


@app.get("/profile")
def get_profile():
    return db.get_profile(get_db_path())


@app.put("/admin/profile")
def save_profile(payload: dict, request: Request):
    require_admin(request)
    return db.save_profile(payload, get_db_path())


@app.get("/projects")
def list_public_projects():
    return db.list_projects(get_db_path(), featured_only=True)


@app.get("/admin/projects")
def list_admin_projects(request: Request):
    require_admin(request)
    return db.list_projects(get_db_path(), featured_only=False)


class ProjectPayload(BaseModel):
    title: str
    description: str
    category: str
    tech_stack: list
    github_url: str
    image_url: str
    proof_line: str
    featured: bool
    source: str = "manual"
    source_id: int | None = None


@app.post("/admin/projects")
def create_project(payload: ProjectPayload, request: Request):
    require_admin(request)
    return db.create_project(payload.model_dump(), get_db_path())


@app.put("/admin/projects/{project_id}")
def update_project(project_id: int, payload: ProjectPayload, request: Request):
    require_admin(request)
    updated = db.update_project(project_id, payload.model_dump(), get_db_path())
    if updated is None:
        raise HTTPException(status_code=404, detail="Project not found.")
    return updated


@app.delete("/admin/projects/{project_id}")
def delete_project(project_id: int, request: Request):
    require_admin(request)
    deleted = db.delete_project(project_id, get_db_path())
    if not deleted:
        raise HTTPException(status_code=404, detail="Project not found.")
    return {"deleted": True}


@app.get("/admin/showcase-importable")
def showcase_importable(request: Request):
    require_admin(request)
    local_ids = db.get_source_ids(get_db_path())
    try:
        return showcase_client.list_importable(local_ids)
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="linkedin-showcase is unreachable.")


@app.post("/admin/projects/import/{showcase_id}")
def import_project(showcase_id: int, request: Request):
    require_admin(request)
    try:
        showcase_project = showcase_client.fetch_project(showcase_id)
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="linkedin-showcase is unreachable.")
    mapped = showcase_client.map_to_portfolio_project(showcase_project)
    return db.create_project(mapped, get_db_path())
```

- [ ] **Step 4: Write `backend/requirements.txt`**

```
fastapi
uvicorn
pydantic
itsdangerous
httpx
pytest
```

- [ ] **Step 5: Write `backend/.env.example`**

```
PORTFOLIO_DB_PATH=portfolio.db
ADMIN_PASSWORD=change-me
SECRET_KEY=change-me-too
SHOWCASE_API_URL=http://127.0.0.1:8000
ADMIN_CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `python -m pytest tests/ -v`
Expected: all pass (9 db + 6 auth + 6 showcase_client + 11 main = 32 passed)

- [ ] **Step 7: Live smoke check**

```bash
cd C:/Portfolio/portfolio/backend
ADMIN_PASSWORD=localtest uvicorn main:app --port 8002 &
sleep 2
curl http://127.0.0.1:8002/health
curl http://127.0.0.1:8002/projects
curl -c cookies.txt -X POST http://127.0.0.1:8002/admin/login -H "Content-Type: application/json" -d '{"password":"localtest"}'
curl -b cookies.txt http://127.0.0.1:8002/admin/whoami
```
Expected: health `{"status":"ok"}`; projects returns 7 seeded, all `featured: true`; login `{"ok":true}`; whoami `{"ok":true}`. Kill the server after (`kill %1` or find the PID).

- [ ] **Step 8: Commit**

```bash
cd C:/Portfolio/portfolio && git add backend/main.py backend/requirements.txt backend/.env.example backend/tests/test_main.py
git commit -m "feat(portfolio-backend): wire API — auth, project/profile CRUD, showcase import

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01CmSPxtLLYJPz6XcbVmYrx6"
```

---

### Task 5: Frontend — api.js

**Files:**
- Create: `src/api.js`

**Interfaces:**
- Produces: `getProfile()`, `getProjects()`, `login(password)`, `logout()`, `whoami()`, `saveProfile(data)`, `getAdminProjects()`, `createProject(data)`, `updateProject(id, data)`, `deleteProject(id)`, `getImportable()`, `importProject(id)` — all return Promises, all throw `Error(message)` on non-2xx.

- [ ] **Step 1: Write `src/api.js`**

```javascript
// src/api.js
const BASE_URL = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8002'

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || `Request failed: ${res.status}`)
  }
  if (res.status === 204) return null
  return res.json()
}

export const getProfile = () => request('/profile')
export const getProjects = () => request('/projects')
export const login = (password) =>
  request('/admin/login', { method: 'POST', body: JSON.stringify({ password }) })
export const logout = () => request('/admin/logout', { method: 'POST' })
export const whoami = () => request('/admin/whoami')
export const saveProfile = (data) =>
  request('/admin/profile', { method: 'PUT', body: JSON.stringify(data) })
export const getAdminProjects = () => request('/admin/projects')
export const createProject = (data) =>
  request('/admin/projects', { method: 'POST', body: JSON.stringify(data) })
export const updateProject = (id, data) =>
  request(`/admin/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteProject = (id) =>
  request(`/admin/projects/${id}`, { method: 'DELETE' })
export const getImportable = () => request('/admin/showcase-importable')
export const importProject = (id) =>
  request(`/admin/projects/import/${id}`, { method: 'POST' })
```

- [ ] **Step 2: Verify no syntax errors**

Run: `cd C:/Portfolio/portfolio && node --check src/api.js`
Expected: no output (success)

- [ ] **Step 3: Commit**

```bash
git add src/api.js
git commit -m "feat(portfolio): add api.js client for the admin backend

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01CmSPxtLLYJPz6XcbVmYrx6"
```

---

### Task 6: Frontend — Projects.jsx dynamic fetch + category tabs

**Files:**
- Modify: `src/components/Projects.jsx` (full rewrite of the data-loading and top section; `ProjectCard` component stays as-is)

**Interfaces:**
- Consumes: `getProjects()` from `src/api.js` (Task 5). Project shape from backend: `{id, title, description, category, tech_stack, github_url, image_url, proof_line, featured, source, source_id}`.

- [ ] **Step 1: Rewrite `src/components/Projects.jsx`**

```jsx
import React, { useEffect, useState } from 'react'
import { getProjects } from '../api.js'

const CATEGORIES = ['All', 'AI/ML', 'Web Dev', 'Automation']

function ProjectCard({ project, index }) {
  const number = String(index + 1).padStart(2, '0')

  return (
    <article className="group grid overflow-hidden rounded-xl border border-line bg-panel transition-colors hover:border-iris/40 md:grid-cols-[2fr_3fr]">
      {project.image_url ? (
        <div className="relative min-h-52 overflow-hidden border-b border-line md:border-b-0 md:border-r">
          <img
            src={project.image_url}
            alt={`${project.title} screenshot`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </div>
      ) : (
        <div className="flex min-h-40 items-center justify-center border-b border-line bg-panel-2 md:min-h-52 md:border-b-0 md:border-r">
          <div className="text-center">
            <p className="font-mono text-5xl font-semibold text-line">{number}</p>
            <p className="mt-3 inline-block rounded-md border border-signal/40 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.15em] text-signal">
              {project.category}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col justify-center p-6 md:p-8">
        <h3 className="font-display text-xl font-bold tracking-tight text-snow md:text-2xl">
          {project.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-fog">{project.description}</p>
        {project.proof_line && (
          <p className="mt-3 font-mono text-xs text-signal">&rarr; {project.proof_line}</p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {project.tech_stack.map((tech) => (
            <span
              key={tech}
              className="rounded-md border border-line bg-panel-2 px-2.5 py-1 font-mono text-xs text-fog"
            >
              {tech}
            </span>
          ))}
        </div>
        {project.github_url && (
          <a
            href={project.github_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex w-fit items-center gap-2 text-sm font-medium text-iris-soft transition-colors hover:text-snow"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clipRule="evenodd"
              />
            </svg>
            View repository
          </a>
        )}
      </div>
    </article>
  )
}

export default function Projects() {
  const [projects, setProjects] = useState(null)
  const [error, setError] = useState(false)
  const [category, setCategory] = useState('All')

  useEffect(() => {
    getProjects()
      .then(setProjects)
      .catch(() => setError(true))
  }, [])

  const visible = (projects || []).filter(
    (p) => category === 'All' || p.category === category
  )

  return (
    <section id="projects" className="py-16 md:py-24">
      <p className="font-mono text-xs font-medium uppercase tracking-[0.25em] text-signal">Projects</p>
      <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-snow">
        Built end to end, not from templates
      </h2>
      <p className="mt-2 text-fog">
        Every project here covers the whole stack: data in, model or logic in the middle, working UI out.
      </p>

      {projects && projects.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                category === cat
                  ? 'border-iris bg-iris text-ink'
                  : 'border-line text-fog hover:border-fog hover:text-snow'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="mt-10 text-sm text-fog">Projects are temporarily unavailable.</p>
      )}

      {!error && !projects && <p className="mt-10 text-sm text-fog">Loading projects&hellip;</p>}

      {!error && projects && visible.length === 0 && (
        <p className="mt-10 text-sm text-fog">No projects in this category yet.</p>
      )}

      <ul className="mt-10 flex flex-col gap-6">
        {visible.map((project, index) => (
          <li key={project.id}>
            <ProjectCard project={project} index={index} />
          </li>
        ))}
      </ul>
    </section>
  )
}
```

- [ ] **Step 2: Build check**

Run: `cd C:/Portfolio/portfolio && npm run build`
Expected: build succeeds (no TypeErrors/JSX errors)

- [ ] **Step 3: Live check**

Start the backend from Task 4 (`ADMIN_PASSWORD=localtest uvicorn main:app --port 8002`) and `npm run dev`. Open the site, confirm: 7 projects load, category tabs filter correctly, no console errors. Stop both servers after.

- [ ] **Step 4: Commit**

```bash
git add src/components/Projects.jsx
git commit -m "feat(portfolio): Projects fetches from backend with category tabs

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01CmSPxtLLYJPz6XcbVmYrx6"
```

---

### Task 7: Frontend — Hero.jsx + AboutIntro.jsx profile-driven text

**Files:**
- Modify: `src/components/Hero.jsx`
- Modify: `src/components/AboutIntro.jsx`

**Interfaces:**
- Consumes: `getProfile()` from `src/api.js` (Task 5). Profile shape: `{hero_tagline, hero_headline, hero_subtext, bio_paragraphs, currently_building, social_links: {github, linkedin, email}}`.

- [ ] **Step 1: Modify `src/components/Hero.jsx`**

Keep the credentials `.eval` card exactly as-is (out of scope). Replace only the static tagline/headline/subtext with profile-driven text, falling back to the current hardcoded copy if the fetch fails or hasn't resolved yet:

```jsx
import React, { useEffect, useState } from 'react'
import me from '../assets/Me.png'
import { getProfile } from '../api.js'

const FALLBACK = {
  hero_tagline: 'AI & full-stack developer',
  hero_headline: 'Real AI systems, built end to end.',
  hero_subtext:
    "CS undergrad who ships RAG pipelines, local-LLM apps, and full-stack tools — running on real hardware, not just in notebooks.",
}

/* The signature element: certification scores presented the way his own
   projects present model output — as a benchmark readout. */
const EVALS = [
  { id: 'AZ-900', name: 'Azure Fundamentals', score: 957, max: 1000, display: '957/1000' },
  { id: 'AI-900', name: 'Azure AI Fundamentals', score: 863, max: 1000, display: '863/1000' },
  { id: 'DP-900', name: 'Azure Data Fundamentals', score: 790, max: 1000, display: '790/1000' },
  { id: 'FSO', name: 'Full Stack Open · Helsinki', score: 1000, max: 1000, display: '5/5 · 7 ECTS' },
]

export default function Hero() {
  const [profile, setProfile] = useState(FALLBACK)

  useEffect(() => {
    getProfile()
      .then(setProfile)
      .catch(() => {})
  }, [])

  return (
    <section id="me" className="flex flex-col items-start gap-12 py-16 md:flex-row md:items-center md:justify-between md:py-24">
      <div className="max-w-xl">
        <div className="rise flex items-center gap-3">
          <img
            src={me}
            alt="Sahilpreet Singh Sidhu"
            className="h-10 w-10 rounded-full border border-line object-cover"
          />
          <span className="text-sm text-fog">Sahilpreet Singh Sidhu · Barnala, India</span>
        </div>

        <p className="rise rise-1 mt-6 font-mono text-xs font-medium uppercase tracking-[0.25em] text-signal">
          {profile.hero_tagline}
        </p>
        <h1 className="rise rise-1 mt-3 font-display text-4xl font-bold leading-[1.08] tracking-tight text-snow md:text-6xl">
          {profile.hero_headline}
        </h1>
        <p className="rise rise-2 mt-5 text-base leading-relaxed text-fog md:text-lg">
          {profile.hero_subtext}
        </p>

        <div className="rise rise-3 mt-8 flex flex-wrap items-center gap-3">
          <a
            href="https://github.com/SahilSidhu7/Me/blob/main/SahilSidhu.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-iris px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-iris-soft"
          >
            Open resume
          </a>
          <a
            href="https://github.com/SahilSidhu7"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-line px-5 py-2.5 text-sm font-medium text-snow transition-colors hover:border-fog"
          >
            GitHub
          </a>
          <a
            href="https://www.linkedin.com/in/sahil-sidhu-ai/"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-line px-5 py-2.5 text-sm font-medium text-snow transition-colors hover:border-fog"
          >
            LinkedIn
          </a>
        </div>

        <p className="rise rise-4 mt-6 font-mono text-xs text-fog">
          Or ask the chat widget in the corner — I built it. It answers questions about me.
        </p>
      </div>

      <div className="rise rise-2 w-full max-w-md md:w-auto md:min-w-[26rem]">
        <div className="overflow-hidden rounded-xl border border-line bg-panel shadow-2xl shadow-black/40">
          <div className="flex items-center justify-between border-b border-line bg-panel-2 px-4 py-2.5">
            <span className="font-mono text-xs text-fog">credentials.eval</span>
            <span className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-line" />
              <span className="h-2.5 w-2.5 rounded-full bg-line" />
              <span className="h-2.5 w-2.5 rounded-full bg-iris/60" />
            </span>
          </div>
          <ul className="divide-y divide-line/60 px-4">
            {EVALS.map((cert) => (
              <li key={cert.id} className="py-3.5">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-mono text-xs text-fog">
                    <span className="text-iris-soft">{cert.id}</span> · {cert.name}
                  </span>
                  <span className="shrink-0 font-mono text-sm font-semibold text-signal">
                    {cert.display}
                  </span>
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-line/60">
                  <div
                    className="h-full rounded-full bg-iris"
                    style={{ width: `${(cert.score / cert.max) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
          <div className="border-t border-line bg-panel-2 px-4 py-2.5 font-mono text-[11px] text-fog">
            verified · certiport.com &amp; mooc.fi
          </div>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Modify `src/components/AboutIntro.jsx`**

Replace the hardcoded bio paragraphs and "Now" bullets with profile-driven content, same fallback pattern:

```jsx
import React, { useEffect, useState } from 'react'
import { getProfile } from '../api.js'

const FALLBACK = {
  bio_paragraphs: [
    "I'm a computer science student at Chitkara University (B.Tech, 2028). Instead of collecting tutorials, I build complete systems: scrape the data, build the pipeline, serve the API, design the frontend, and put it on a real server behind Cloudflare.",
    "Most of my work runs local LLMs with Ollama — RAG pipelines over FAISS, automation workflows in n8n, and FastAPI backends with React frontends. The chatbot on this page is one of them.",
  ],
  currently_building: [
    'Building Cricket AI Assistant — RAG Q&A over cricket stats',
    'B.Tech CS @ Chitkara University · class of 2028',
    'Open to software / AI engineering internships',
  ],
}

export default function AboutIntro() {
  const [profile, setProfile] = useState(FALLBACK)

  useEffect(() => {
    getProfile()
      .then(setProfile)
      .catch(() => {})
  }, [])

  return (
    <section className="py-10 md:py-14">
      <div className="grid gap-10 rounded-xl border border-line bg-panel px-6 py-8 md:grid-cols-[3fr_2fr] md:gap-14 md:px-10 md:py-10">
        <div>
          <p className="font-mono text-xs font-medium uppercase tracking-[0.25em] text-signal">
            About
          </p>
          <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-snow md:text-3xl">
            I learn by shipping the whole thing.
          </h2>
          {profile.bio_paragraphs.map((paragraph, i) => (
            <p key={i} className="mt-4 text-sm leading-relaxed text-fog md:text-base">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="flex flex-col gap-6 text-sm md:border-l md:border-line md:pl-10">
          <div>
            <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-fog">Now</h3>
            <ul className="mt-3 space-y-2 text-snow">
              {profile.currently_building.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-fog">How I work</h3>
            <ul className="mt-3 space-y-2 text-snow">
              <li>End to end — data, backend, frontend, deploy</li>
              <li>Test-driven where it counts</li>
              <li>Local-first AI: private, cheap, always on</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Build check**

Run: `npm run build`
Expected: build succeeds

- [ ] **Step 4: Commit**

```bash
git add src/components/Hero.jsx src/components/AboutIntro.jsx
git commit -m "feat(portfolio): Hero and AboutIntro pull copy from profile API

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01CmSPxtLLYJPz6XcbVmYrx6"
```

---

### Task 8: Frontend — App.jsx routing + AdminApp shell + Login

**Files:**
- Modify: `src/App.jsx`
- Create: `src/admin/AdminApp.jsx`, `src/admin/Login.jsx`

**Interfaces:**
- Consumes: `login`, `whoami`, `logout` from `src/api.js` (Task 5).
- Produces: `AdminApp` default export — the full admin shell, rendered when `pathname === '/admin'`. `AdminApp` renders `Login` until authenticated; ProjectsTab/ProfileTab (Task 9/10) plug into it via `view` state.

- [ ] **Step 1: Modify `src/App.jsx`**

```jsx
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import AboutIntro from './components/AboutIntro'
import Skills from './components/skills.jsx'
import Certificates from './components/Certificates'
import Projects from './components/Projects'
import About from './components/About'
import AdminApp from './admin/AdminApp.jsx'

function App() {
  if (typeof window !== 'undefined' && window.location.pathname === '/admin') {
    return <AdminApp />
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl px-6 md:px-8">
        <Hero />
        <AboutIntro />
        <Projects />
        <Skills />
        <Certificates />
        <About />
      </main>
    </div>
  )
}

export default App
```

- [ ] **Step 2: Create `src/admin/Login.jsx`**

```jsx
import React, { useState } from 'react'
import { login } from '../api.js'

export default function Login({ onLoggedIn }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(password)
      onLoggedIn()
    } catch {
      setError('Incorrect password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl border border-line bg-panel p-8"
      >
        <h1 className="font-display text-xl font-bold text-snow">Admin login</h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          className="mt-6 w-full rounded-lg border border-line bg-panel-2 px-4 py-2.5 text-snow outline-none focus:border-iris"
        />
        {error && <p className="mt-3 text-sm text-signal">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full rounded-lg bg-iris px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-iris-soft disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 3: Create `src/admin/AdminApp.jsx`** (with placeholder tabs — Task 9/10 replace these)

```jsx
import React, { useEffect, useState } from 'react'
import { whoami, logout } from '../api.js'
import Login from './Login.jsx'

export default function AdminApp() {
  const [checking, setChecking] = useState(true)
  const [authed, setAuthed] = useState(false)
  const [view, setView] = useState('projects')

  useEffect(() => {
    whoami()
      .then(() => setAuthed(true))
      .catch(() => setAuthed(false))
      .finally(() => setChecking(false))
  }, [])

  async function handleLogout() {
    await logout()
    setAuthed(false)
  }

  if (checking) {
    return <div className="flex min-h-screen items-center justify-center bg-ink text-fog">Loading&hellip;</div>
  }

  if (!authed) {
    return <Login onLoggedIn={() => setAuthed(true)} />
  }

  return (
    <div className="min-h-screen bg-ink text-snow">
      <header className="flex items-center justify-between border-b border-line px-6 py-4">
        <h1 className="font-display text-lg font-bold">Portfolio Admin</h1>
        <nav className="flex gap-2">
          <button
            type="button"
            onClick={() => setView('projects')}
            className={`rounded-lg px-4 py-2 text-sm ${view === 'projects' ? 'bg-iris text-ink' : 'text-fog hover:text-snow'}`}
          >
            Projects
          </button>
          <button
            type="button"
            onClick={() => setView('profile')}
            className={`rounded-lg px-4 py-2 text-sm ${view === 'profile' ? 'bg-iris text-ink' : 'text-fog hover:text-snow'}`}
          >
            Profile
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-line px-4 py-2 text-sm text-fog hover:text-snow"
          >
            Log out
          </button>
        </nav>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-8">
        {view === 'projects' && <p className="text-fog">Projects tab — added in Task 9.</p>}
        {view === 'profile' && <p className="text-fog">Profile tab — added in Task 10.</p>}
      </main>
    </div>
  )
}
```

- [ ] **Step 4: Build check**

Run: `npm run build`
Expected: build succeeds

- [ ] **Step 5: Live check**

Backend running (`ADMIN_PASSWORD=localtest uvicorn main:app --port 8002`), `npm run dev`, visit `http://localhost:5173/admin`. Confirm: login form shows, wrong password shows error, correct password ("localtest") shows the dashboard shell, Log out returns to login. Confirm public site at `http://localhost:5173/` is unaffected.

- [ ] **Step 6: Commit**

```bash
git add src/App.jsx src/admin/AdminApp.jsx src/admin/Login.jsx
git commit -m "feat(portfolio): /admin path renders login-gated admin shell

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01CmSPxtLLYJPz6XcbVmYrx6"
```

---

### Task 9: Frontend — Admin ProjectsTab (CRUD + import)

**Files:**
- Create: `src/admin/ProjectsTab.jsx`
- Modify: `src/admin/AdminApp.jsx:` replace the `view === 'projects'` placeholder line with `<ProjectsTab />` and add the import at the top.

**Interfaces:**
- Consumes: `getAdminProjects, createProject, updateProject, deleteProject, getImportable, importProject` from `src/api.js` (Task 5).

- [ ] **Step 1: Create `src/admin/ProjectsTab.jsx`**

```jsx
import React, { useEffect, useState } from 'react'
import {
  getAdminProjects,
  createProject,
  updateProject,
  deleteProject,
  getImportable,
  importProject,
} from '../api.js'

const CATEGORIES = ['AI/ML', 'Web Dev', 'Automation', 'Uncategorized']
const EMPTY_FORM = {
  title: '', description: '', category: 'AI/ML', tech_stack: '', github_url: '',
  image_url: '', proof_line: '', featured: true,
}

function ProjectForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(
    initial
      ? { ...initial, tech_stack: initial.tech_stack.join(', ') }
      : EMPTY_FORM
  )

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    await onSave({
      ...form,
      tech_stack: form.tech_stack.split(',').map((t) => t.trim()).filter(Boolean),
      source: initial?.source || 'manual',
      source_id: initial?.source_id ?? null,
    })
  }

  const field = (label, key, type = 'text') => (
    <label className="block">
      <span className="text-xs text-fog">{label}</span>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => set(key, e.target.value)}
        className="mt-1 w-full rounded-lg border border-line bg-panel-2 px-3 py-2 text-sm text-snow outline-none focus:border-iris"
      />
    </label>
  )

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 rounded-xl border border-line bg-panel p-6">
      {field('Title', 'title')}
      <label className="block">
        <span className="text-xs text-fog">Description</span>
        <textarea
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-lg border border-line bg-panel-2 px-3 py-2 text-sm text-snow outline-none focus:border-iris"
        />
      </label>
      <label className="block">
        <span className="text-xs text-fog">Category</span>
        <select
          value={form.category}
          onChange={(e) => set('category', e.target.value)}
          className="mt-1 w-full rounded-lg border border-line bg-panel-2 px-3 py-2 text-sm text-snow outline-none focus:border-iris"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </label>
      {field('Tech stack (comma-separated)', 'tech_stack')}
      {field('GitHub URL', 'github_url')}
      {field('Image URL', 'image_url')}
      {field('Proof line', 'proof_line')}
      <label className="flex items-center gap-2 text-sm text-snow">
        <input
          type="checkbox"
          checked={form.featured}
          onChange={(e) => set('featured', e.target.checked)}
        />
        Visible on public site
      </label>
      <div className="flex gap-3">
        <button type="submit" className="rounded-lg bg-iris px-4 py-2 text-sm font-semibold text-ink hover:bg-iris-soft">
          Save
        </button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-line px-4 py-2 text-sm text-fog hover:text-snow">
          Cancel
        </button>
      </div>
    </form>
  )
}

export default function ProjectsTab() {
  const [projects, setProjects] = useState([])
  const [importable, setImportable] = useState([])
  const [editing, setEditing] = useState(null)
  const [adding, setAdding] = useState(false)
  const [importError, setImportError] = useState('')

  function refresh() {
    getAdminProjects().then(setProjects)
  }

  function refreshImportable() {
    setImportError('')
    getImportable()
      .then(setImportable)
      .catch((err) => setImportError(err.message))
  }

  useEffect(() => {
    refresh()
    refreshImportable()
  }, [])

  async function handleCreate(data) {
    await createProject(data)
    setAdding(false)
    refresh()
  }

  async function handleUpdate(data) {
    await updateProject(editing.id, data)
    setEditing(null)
    refresh()
  }

  async function handleDelete(id) {
    await deleteProject(id)
    refresh()
  }

  async function handleImport(showcaseId) {
    await importProject(showcaseId)
    refresh()
    refreshImportable()
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Projects</h2>
          {!adding && !editing && (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="rounded-lg bg-iris px-4 py-2 text-sm font-semibold text-ink hover:bg-iris-soft"
            >
              Add project
            </button>
          )}
        </div>

        {adding && <ProjectForm onSave={handleCreate} onCancel={() => setAdding(false)} />}
        {editing && (
          <ProjectForm initial={editing} onSave={handleUpdate} onCancel={() => setEditing(null)} />
        )}

        {!adding && !editing && (
          <div className="overflow-hidden rounded-xl border border-line">
            <table className="w-full text-sm">
              <thead className="bg-panel-2 text-left text-xs uppercase tracking-wide text-fog">
                <tr>
                  <th className="px-4 py-2">Title</th>
                  <th className="px-4 py-2">Category</th>
                  <th className="px-4 py-2">Visible</th>
                  <th className="px-4 py-2">Source</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.id} className="border-t border-line bg-panel">
                    <td className="px-4 py-2 text-snow">{p.title}</td>
                    <td className="px-4 py-2 text-fog">{p.category}</td>
                    <td className="px-4 py-2 text-fog">{p.featured ? 'Yes' : 'Draft'}</td>
                    <td className="px-4 py-2 text-fog">{p.source}</td>
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        onClick={() => setEditing(p)}
                        className="mr-3 text-iris-soft hover:text-snow"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id)}
                        className="text-signal hover:text-snow"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg font-bold">Import from LinkedIn Showcase</h2>
        {importError && <p className="text-sm text-signal">{importError}</p>}
        {!importError && importable.length === 0 && (
          <p className="text-sm text-fog">Nothing new to import.</p>
        )}
        <ul className="flex flex-col gap-2">
          {importable.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-lg border border-line bg-panel px-4 py-3"
            >
              <span className="text-sm text-snow">{p.title}</span>
              <button
                type="button"
                onClick={() => handleImport(p.id)}
                className="rounded-lg border border-iris px-3 py-1.5 text-xs font-medium text-iris-soft hover:bg-iris hover:text-ink"
              >
                Import
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Wire into `src/admin/AdminApp.jsx`**

Add the import at the top:
```jsx
import ProjectsTab from './ProjectsTab.jsx'
```
Replace the line `{view === 'projects' && <p className="text-fog">Projects tab — added in Task 9.</p>}` with:
```jsx
{view === 'projects' && <ProjectsTab />}
```

- [ ] **Step 3: Build check**

Run: `npm run build`
Expected: build succeeds

- [ ] **Step 4: Live check**

With backend running and linkedin-showcase's backend also running (`cd C:/Portfolio/linkedin-showcase/backend && uvicorn main:app --port 8000`), log into `/admin`: add a manual project, edit it, delete it; confirm the import list shows a real showcase project (create one via linkedin-showcase's UI first if the library is empty) and importing it adds it to the table with category "Uncategorized" and "Draft" visibility.

- [ ] **Step 5: Commit**

```bash
git add src/admin/ProjectsTab.jsx src/admin/AdminApp.jsx
git commit -m "feat(portfolio): admin Projects tab — CRUD table + showcase import

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01CmSPxtLLYJPz6XcbVmYrx6"
```

---

### Task 10: Frontend — Admin ProfileTab

**Files:**
- Create: `src/admin/ProfileTab.jsx`
- Modify: `src/admin/AdminApp.jsx`: add import, replace the `view === 'profile'` placeholder.

**Interfaces:**
- Consumes: `getProfile, saveProfile` from `src/api.js` (Task 5). Profile shape (Task 1/6): `{hero_tagline, hero_headline, hero_subtext, bio_paragraphs (list), currently_building (list), social_links: {github, linkedin, email}}`.

- [ ] **Step 1: Create `src/admin/ProfileTab.jsx`**

```jsx
import React, { useEffect, useState } from 'react'
import { getProfile, saveProfile } from '../api.js'

export default function ProfileTab() {
  const [profile, setProfile] = useState(null)
  const [bioText, setBioText] = useState('')
  const [buildingText, setBuildingText] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    getProfile().then((data) => {
      setProfile(data)
      setBioText(data.bio_paragraphs.join('\n\n'))
      setBuildingText(data.currently_building.join('\n'))
    })
  }, [])

  async function handleSave() {
    setMessage('')
    const updated = {
      ...profile,
      bio_paragraphs: bioText.split('\n\n').map((p) => p.trim()).filter(Boolean),
      currently_building: buildingText.split('\n').map((l) => l.trim()).filter(Boolean),
    }
    const saved = await saveProfile(updated)
    setProfile(saved)
    setMessage('Saved.')
  }

  if (!profile) return <p className="text-fog">Loading&hellip;</p>

  const field = (label, key) => (
    <label className="block">
      <span className="text-xs text-fog">{label}</span>
      <input
        type="text"
        value={profile[key] || ''}
        onChange={(e) => setProfile({ ...profile, [key]: e.target.value })}
        className="mt-1 w-full rounded-lg border border-line bg-panel-2 px-3 py-2 text-sm text-snow outline-none focus:border-iris"
      />
    </label>
  )

  const socialField = (label, key) => (
    <label className="block">
      <span className="text-xs text-fog">{label}</span>
      <input
        type="text"
        value={profile.social_links[key] || ''}
        onChange={(e) =>
          setProfile({ ...profile, social_links: { ...profile.social_links, [key]: e.target.value } })
        }
        className="mt-1 w-full rounded-lg border border-line bg-panel-2 px-3 py-2 text-sm text-snow outline-none focus:border-iris"
      />
    </label>
  )

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-line bg-panel p-6">
      {field('Hero tagline', 'hero_tagline')}
      {field('Hero headline', 'hero_headline')}
      <label className="block">
        <span className="text-xs text-fog">Hero subtext</span>
        <textarea
          value={profile.hero_subtext}
          onChange={(e) => setProfile({ ...profile, hero_subtext: e.target.value })}
          rows={2}
          className="mt-1 w-full rounded-lg border border-line bg-panel-2 px-3 py-2 text-sm text-snow outline-none focus:border-iris"
        />
      </label>
      <label className="block">
        <span className="text-xs text-fog">Bio paragraphs (blank line between paragraphs)</span>
        <textarea
          value={bioText}
          onChange={(e) => setBioText(e.target.value)}
          rows={6}
          className="mt-1 w-full rounded-lg border border-line bg-panel-2 px-3 py-2 text-sm text-snow outline-none focus:border-iris"
        />
      </label>
      <label className="block">
        <span className="text-xs text-fog">Currently building (one per line)</span>
        <textarea
          value={buildingText}
          onChange={(e) => setBuildingText(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-lg border border-line bg-panel-2 px-3 py-2 text-sm text-snow outline-none focus:border-iris"
        />
      </label>
      {socialField('GitHub URL', 'github')}
      {socialField('LinkedIn URL', 'linkedin')}
      {socialField('Email', 'email')}
      <div>
        <button
          type="button"
          onClick={handleSave}
          className="rounded-lg bg-iris px-5 py-2.5 text-sm font-semibold text-ink hover:bg-iris-soft"
        >
          Save profile
        </button>
        {message && <span className="ml-3 text-sm text-fog">{message}</span>}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Wire into `src/admin/AdminApp.jsx`**

Add import:
```jsx
import ProfileTab from './ProfileTab.jsx'
```
Replace `{view === 'profile' && <p className="text-fog">Profile tab — added in Task 10.</p>}` with:
```jsx
{view === 'profile' && <ProfileTab />}
```

- [ ] **Step 3: Build check**

Run: `npm run build`
Expected: build succeeds

- [ ] **Step 4: Live check**

Log into `/admin`, open Profile tab, change the hero tagline, save, confirm the message shows "Saved.", reload `/admin` and confirm the change persisted, then check the public site (`/`) shows the updated tagline.

- [ ] **Step 5: Commit**

```bash
git add src/admin/ProfileTab.jsx src/admin/AdminApp.jsx
git commit -m "feat(portfolio): admin Profile tab — edit hero/bio/socials

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01CmSPxtLLYJPz6XcbVmYrx6"
```

---

### Task 11: Final integration — README, .gitignore, full end-to-end verification

**Files:**
- Create: `backend/README.md`
- Modify: `backend/.gitignore` (create if absent)

**Interfaces:**
- Consumes: the entire system built in Tasks 1–10.

- [ ] **Step 1: Write `backend/.gitignore`**

```
portfolio.db
test_main.db
.env
__pycache__/
*.pyc
```

- [ ] **Step 2: Write `backend/README.md`**

```markdown
# Portfolio Admin Backend

Small FastAPI + SQLite service that powers the portfolio's admin dashboard:
categorized project management and editable profile copy, plus one-click
import from the linkedin-showcase project library.

## Setup

    pip install -r requirements.txt
    cp .env.example .env   # set ADMIN_PASSWORD and SECRET_KEY
    uvicorn main:app --reload --port 8002

## Frontend

The portfolio's Vite app reads `VITE_API_BASE` (default `http://127.0.0.1:8002`).
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
```

- [ ] **Step 3: Full backend suite**

Run: `cd C:/Portfolio/portfolio/backend && python -m pytest tests/ -v`
Expected: all tests pass (32 total across db/auth/showcase_client/main)

- [ ] **Step 4: Full live end-to-end walkthrough**

Start three servers: portfolio backend (`ADMIN_PASSWORD=localtest uvicorn main:app --port 8002`, from `backend/`), linkedin-showcase backend (`uvicorn main:app --port 8000`, from `C:/Portfolio/linkedin-showcase/backend/`), and the portfolio frontend (`npm run dev`, from `C:/Portfolio/portfolio/`).

Walk through: public site loads all 7 seeded projects with correct categories; category tabs filter; `/admin` requires login; add a manual project via the admin Projects tab and confirm it appears on the public site after refresh; edit the hero tagline via the admin Profile tab and confirm it updates on the public site; add a project in linkedin-showcase's own UI, then import it from the portfolio admin's "Import from LinkedIn Showcase" panel, confirm it lands as a Draft under "Uncategorized", set its category and visibility, confirm it then appears publicly; stop the linkedin-showcase backend and confirm the import panel shows a clear unavailable message rather than crashing the admin page.

Stop all three servers after.

- [ ] **Step 5: Commit**

```bash
cd C:/Portfolio/portfolio && git add backend/README.md backend/.gitignore
git commit -m "docs(portfolio-backend): setup/API README, gitignore db and secrets

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01CmSPxtLLYJPz6XcbVmYrx6"
```

---

## Self-review notes

- Spec coverage: profile+projects schema (T1), auth (T2), showcase import client (T3), full API wiring incl. featured-filtered public/admin project lists (T4), public Projects/Hero/AboutIntro dynamism (T6/T7), admin shell+login (T8), Projects CRUD+import UI (T9), Profile UI (T10), README+gitignore+e2e verification (T11). Out-of-scope items (Skills/Certificates static, no image upload, no multi-user auth, no two-way sync, no pagination) are honored — no task touches `skills.jsx` or `Certificates.jsx`, no file-upload code anywhere, auth is single-password only. ✓
- Types consistent: project dict shape (`id, title, description, category, tech_stack, github_url, image_url, proof_line, featured, source, source_id, created_at, updated_at`) identical across T1 (db.py), T3 (showcase_client mapping), T4 (Pydantic ProjectPayload), T6/T9 (frontend). Profile shape identical across T1, T4, T7, T10. ✓
- `featured` semantics (publish flag, imports default False) stated once in Global Constraints and applied consistently in T1's `list_projects(featured_only=)`, T4's public vs admin routes, T3's import mapping. ✓
