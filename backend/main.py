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
