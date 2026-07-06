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
