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
