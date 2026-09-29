import os
import shutil

import main
from fastapi.testclient import TestClient

client = TestClient(main.app)

PDF_BYTES = b"%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n"
FIELDS = {
    "title": "Capacity is not the bottleneck",
    "summary": "24 logged attempts at small-model 2D animation.",
    "kind": "Findings",
    "project": "2DVideoGen",
    "published_on": "2026-09-17",
    "tags": "T5, small models, evaluation",
    "external_url": "",
    "featured": "true",
}


def setup_function():
    os.environ["PORTFOLIO_DB_PATH"] = "test_papers.db"
    os.environ["PAPERS_DIR"] = "test_papers_files"
    os.environ["ADMIN_PASSWORD"] = "test-password-123"
    teardown_function()


def teardown_function():
    if os.path.exists("test_papers.db"):
        os.remove("test_papers.db")
    shutil.rmtree("test_papers_files", ignore_errors=True)
    client.cookies.clear()


def login():
    assert client.post("/admin/login", json={"password": "test-password-123"}).status_code == 200


def upload(fields=None, content=PDF_BYTES, filename="paper.pdf", ctype="application/pdf"):
    return client.post(
        "/admin/papers",
        data=fields or FIELDS,
        files={"file": (filename, content, ctype)},
    )


def test_public_papers_empty_by_default():
    resp = client.get("/papers")
    assert resp.status_code == 200
    assert resp.json() == []


def test_upload_requires_admin():
    assert upload().status_code == 401


def test_upload_lists_and_serves_pdf():
    login()
    created = upload()
    assert created.status_code == 200
    paper = created.json()
    assert paper["title"] == FIELDS["title"]
    assert paper["tags"] == ["T5", "small models", "evaluation"]
    assert paper["has_file"] is True

    public = client.get("/papers").json()
    assert [p["id"] for p in public] == [paper["id"]]
    assert "file_name" not in public[0]

    client.cookies.clear()
    pdf = client.get(f"/papers/{paper['id']}/file")
    assert pdf.status_code == 200
    assert pdf.headers["content-type"] == "application/pdf"
    assert pdf.content == PDF_BYTES


def test_rejects_non_pdf_upload():
    login()
    resp = upload(content=b"<html>not a pdf</html>", filename="evil.pdf")
    assert resp.status_code == 400


def test_link_only_paper_without_file():
    login()
    fields = {**FIELDS, "external_url": "https://github.com/SahilSidhu7/2DVideoGen/blob/main/ATTEMPTS.md"}
    resp = client.post("/admin/papers", data=fields)
    assert resp.status_code == 200
    assert resp.json()["has_file"] is False
    assert client.get(f"/papers/{resp.json()['id']}/file").status_code == 404


def test_paper_needs_file_or_link():
    login()
    assert client.post("/admin/papers", data=FIELDS).status_code == 400


def test_drafts_hidden_from_public_and_file_route():
    login()
    paper = upload(fields={**FIELDS, "featured": "false"}).json()
    client.cookies.clear()
    assert client.get("/papers").json() == []
    assert client.get(f"/papers/{paper['id']}/file").status_code == 404


def test_update_metadata_and_delete_removes_file():
    login()
    paper = upload().json()
    updated = client.put(
        f"/admin/papers/{paper['id']}",
        json={
            "title": "Renamed", "summary": "s", "kind": "Paper", "project": "Sentinal",
            "published_on": "2026-09-20", "tags": ["anomaly detection"],
            "external_url": "", "featured": True,
        },
    )
    assert updated.status_code == 200
    assert updated.json()["title"] == "Renamed"
    assert updated.json()["has_file"] is True

    stored = os.listdir("test_papers_files")
    assert len(stored) == 1
    assert client.delete(f"/admin/papers/{paper['id']}").json() == {"deleted": True}
    assert os.listdir("test_papers_files") == []
    assert client.delete(f"/admin/papers/{paper['id']}").status_code == 404
