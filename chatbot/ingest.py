import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

import re
import time
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

from chunking import make_chunks
from retrieval import build_indexes

load_dotenv()

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}


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

                # Remove unwanted elements
                for element in soup(["script", "style", "nav", "footer", "aside", "header"]):
                    element.decompose()

                title = soup.title.string.strip() if soup.title and soup.title.string else "No Title"

                # Extract all text from body
                body = soup.find('body')
                if body:
                    text = body.get_text(separator='\n', strip=True)
                else:
                    text = soup.get_text(separator='\n', strip=True)

                # Clean up text: remove excessive newlines
                text = re.sub(r'\n+', '\n', text)
                text = re.sub(r'\n\s*\n', '\n\n', text)

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


def main(base_url: str = "https://sahilsidhu.pro", store_dir: str = "store"):
    pages = scrape_website(base_url)
    print(f"Scraped {len(pages)} pages")
    if not pages:
        print("No documents scraped.")
        return
    chunks = make_chunks(pages)
    print(f"Created {len(chunks)} chunks")
    build_indexes(chunks, store_dir=store_dir)
    print(f"Store written to {store_dir}/")


if __name__ == "__main__":
    main()