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
    first_media = media[0] if media else ""
    if isinstance(first_media, dict):
        first_media = first_media.get("download_url", "")
    return {
        "title": showcase_project["title"],
        "description": showcase_project["description"],
        "category": "Uncategorized",
        "tech_stack": showcase_project["tech_stack"],
        "github_url": showcase_project["github_url"],
        "image_url": first_media,
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
