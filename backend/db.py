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
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS papers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            summary TEXT NOT NULL,
            kind TEXT NOT NULL,
            project TEXT NOT NULL,
            published_on TEXT NOT NULL,
            tags TEXT NOT NULL,
            external_url TEXT NOT NULL,
            file_name TEXT NOT NULL DEFAULT '',
            featured INTEGER NOT NULL DEFAULT 1,
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
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    existing = conn.execute("SELECT 1 FROM projects WHERE id = ?", (project_id,)).fetchone()
    if existing is None:
        conn.close()
        return None

    now = datetime.now(timezone.utc).isoformat()
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
    conn.close()
    return get_project(project_id, db_path)


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


def _row_to_paper(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "title": row["title"],
        "summary": row["summary"],
        "kind": row["kind"],
        "project": row["project"],
        "published_on": row["published_on"],
        "tags": json.loads(row["tags"]),
        "external_url": row["external_url"],
        "file_name": row["file_name"],
        "has_file": bool(row["file_name"]),
        "featured": bool(row["featured"]),
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def list_papers(db_path: str = DEFAULT_DB_PATH, featured_only: bool = False) -> list:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    query = "SELECT * FROM papers"
    if featured_only:
        query += " WHERE featured = 1"
    query += " ORDER BY published_on DESC, id DESC"
    rows = conn.execute(query).fetchall()
    conn.close()
    return [_row_to_paper(row) for row in rows]


def get_paper(paper_id: int, db_path: str = DEFAULT_DB_PATH):
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    row = conn.execute("SELECT * FROM papers WHERE id = ?", (paper_id,)).fetchone()
    conn.close()
    return _row_to_paper(row) if row else None


def create_paper(data: dict, db_path: str = DEFAULT_DB_PATH) -> dict:
    now = datetime.now(timezone.utc).isoformat()
    conn = sqlite3.connect(db_path)
    cursor = conn.execute(
        """
        INSERT INTO papers
            (title, summary, kind, project, published_on, tags, external_url,
             file_name, featured, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            data["title"],
            data["summary"],
            data["kind"],
            data["project"],
            data["published_on"],
            json.dumps(data["tags"]),
            data["external_url"],
            data.get("file_name", ""),
            1 if data["featured"] else 0,
            now,
            now,
        ),
    )
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return get_paper(new_id, db_path)


def update_paper(paper_id: int, data: dict, db_path: str = DEFAULT_DB_PATH):
    if get_paper(paper_id, db_path) is None:
        return None
    now = datetime.now(timezone.utc).isoformat()
    conn = sqlite3.connect(db_path)
    conn.execute(
        """
        UPDATE papers
        SET title = ?, summary = ?, kind = ?, project = ?, published_on = ?,
            tags = ?, external_url = ?, featured = ?, updated_at = ?
        WHERE id = ?
        """,
        (
            data["title"],
            data["summary"],
            data["kind"],
            data["project"],
            data["published_on"],
            json.dumps(data["tags"]),
            data["external_url"],
            1 if data["featured"] else 0,
            now,
            paper_id,
        ),
    )
    conn.commit()
    conn.close()
    return get_paper(paper_id, db_path)


def delete_paper(paper_id: int, db_path: str = DEFAULT_DB_PATH) -> bool:
    conn = sqlite3.connect(db_path)
    cursor = conn.execute("DELETE FROM papers WHERE id = ?", (paper_id,))
    conn.commit()
    deleted = cursor.rowcount > 0
    conn.close()
    return deleted
