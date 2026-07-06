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
