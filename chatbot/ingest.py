import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

import os
import pathlib
import time
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

# load_dotenv() has to run before chunking and retrieval are imported, not
# after. Both read their model names with os.getenv at module level, so an
# import placed above this line captures the defaults and silently ignores
# .env - which is how EMBED_MODEL ended up pointing at a model that was never
# pulled, and every ingest died on a 404 from /api/embed.
load_dotenv()

from chunking import make_chunks  # noqa: E402
from retrieval import build_indexes  # noqa: E402

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}


def extract_text(soup: BeautifulSoup) -> str:
    """Join each top-level content section's text into real paragraphs, separated by blank lines."""
    containers = soup.find_all(["section", "footer"]) or [soup.find("body") or soup]

    collected = []
    for element in containers:
        if any(element in c.descendants for c in collected):
            continue  # nested inside an already-collected section (e.g. section inside main)
        collected.append(element)

    paragraphs = []
    for element in collected:
        text = " ".join(element.get_text(separator=" ").split())
        if text:
            paragraphs.append(text)
    return "\n\n".join(paragraphs)


def scrape_website(base_url, max_pages=50):  # Increased max_pages for more coverage

    visited = set()
    queue = [base_url]
    documents = []

    options = Options()
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1920,1080")
    options.add_argument(f"--user-agent={HEADERS['User-Agent']}")

    from selenium.webdriver.chrome.service import Service
    from webdriver_manager.chrome import ChromeDriverManager

    driver = webdriver.Chrome(
        service=Service(ChromeDriverManager().install()),
        options=options
    )

    try:
        while queue and len(visited) < max_pages:
            url = queue.pop(0)
            print(f"Scraping: {url}")

            if url in visited:
                continue

            visited.add(url)

            try:
                driver.get(url)
                time.sleep(3)  # Wait for page to load

                # Scroll to load dynamic content
                for _ in range(5):  # Scroll multiple times
                    driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                    time.sleep(2)

                # Try to click load more buttons if present
                try:
                    load_buttons = driver.find_elements(By.XPATH, "//button[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'load') or contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'more') or contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'show')]")
                    for button in load_buttons:
                        try:
                            button.click()
                            time.sleep(2)
                        except:
                            pass
                except:
                    pass

                html = driver.page_source
                soup = BeautifulSoup(html, "html.parser")

                # Remove unwanted elements (keep footer: contact info often lives there)
                for element in soup(["script", "style", "nav", "aside", "header"]):
                    element.decompose()

                title = soup.title.string.strip() if soup.title and soup.title.string else "No Title"

                # Extract per-section text so paragraphs stay real (not word-soup from SPA spans)
                text = extract_text(soup)

                if text.strip():
                    documents.append({"url": url, "title": title, "text": text})

                # Find all links
                for link in soup.find_all("a", href=True):
                    full_url = urljoin(url, link["href"])
                    # Normalize URL: remove fragments
                    full_url = full_url.split('#')[0]
                    if (full_url.startswith(base_url) and 
                        full_url not in visited and 
                        not full_url.endswith(('.pdf', '.jpg', '.png', '.gif', '.css', '.js', '.ico')) and
                        'mailto:' not in full_url and
                        'tel:' not in full_url):
                        queue.append(full_url)

            except Exception as e:
                print(f"Error scraping {url}: {e}")
                continue

    finally:
        driver.quit()

    return documents


# The site is a single-page app: the crawler finds no links to follow and
# comes back with one page of about four thousand characters. Anything the
# visitor cannot see without clicking - the CV in particular - is absent from
# the index, so the assistant refuses perfectly reasonable questions. These
# files are read straight off disk to fill that gap.
EXTRA_DOCS = [
    ("../resume.md", "https://sahilsidhu.pro", "CV"),
]


def load_local_docs() -> list[dict]:
    docs = []
    for relative, url, title in EXTRA_DOCS:
        path = pathlib.Path(__file__).parent / relative
        if not path.exists():
            print(f"skipped missing {path}")
            continue
        text = path.read_text(encoding="utf-8").strip()
        if text:
            docs.append({"url": url, "title": title, "text": text})
            print(f"loaded {path.name} ({len(text)} chars)")
    return docs


# The admin API holds the project list and profile copy as structured data.
# Scraping the rendered page gets a compressed version of the same thing at
# best, and often misses it entirely, so it is read from the source instead.
PORTFOLIO_API = os.getenv("PORTFOLIO_API", "http://127.0.0.1:8002")


def load_api_docs() -> list[dict]:
    """Read the project list and profile copy from the admin API.

    Scraping the rendered page gets a compressed version of the same content
    at best and usually misses it, because the site is a single-page app whose
    text is assembled in the browser. The API is where this actually lives.
    """
    docs = []
    try:
        profile = requests.get(f"{PORTFOLIO_API}/profile", timeout=10).json()
        parts = [profile.get("hero_headline", ""), profile.get("hero_subtext", "")]
        parts += profile.get("bio_paragraphs", []) or []
        for key, value in profile.items():
            if isinstance(value, list) and key != "bio_paragraphs":
                parts += [str(v) for v in value]
        text = "\n\n".join(x for x in parts if x)
        if text:
            docs.append({"url": "https://sahilsidhu.pro", "title": "Profile", "text": text})
            print(f"loaded profile ({len(text)} chars)")

        projects = requests.get(f"{PORTFOLIO_API}/projects", timeout=10).json()
        for project in projects:
            text = "\n".join(
                [
                    f"Project: {project['title']}",
                    project.get("description", ""),
                    f"Category: {project.get('category', '')}",
                    f"Built with: {', '.join(project.get('tech_stack') or [])}",
                    f"Source: {project.get('github_url', '')}",
                    project.get("proof_line", ""),
                ]
            )
            docs.append(
                {"url": "https://sahilsidhu.pro", "title": project["title"], "text": text}
            )
        print(f"loaded {len(projects)} projects")
    except Exception as exc:            # the site is still ingestable without it
        print(f"admin API unavailable ({exc}); continuing without it")
    return docs


def main(base_url: str = "https://sahilsidhu.pro", store_dir: str = "store"):
    pages = scrape_website(base_url)
    print(f"Scraped {len(pages)} pages")
    pages += load_local_docs()
    pages += load_api_docs()
    if not pages:
        print("No documents scraped.")
        return
    chunks = make_chunks(pages)
    print(f"Created {len(chunks)} chunks")
    build_indexes(chunks, store_dir=store_dir)
    print(f"Store written to {store_dir}/")


if __name__ == "__main__":
    main()