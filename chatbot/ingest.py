import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

#for react sites
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
import time

import os
from dotenv import load_dotenv

from langchain_community.vectorstores import FAISS
from langchain_ollama import OllamaEmbeddings
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

load_dotenv()

OLLAMA_URL = os.getenv("ollama_url")
MODEL = os.getenv("model")

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
                import re
                text = re.sub(r'\n+', '\n', text)
                text = re.sub(r'\n\s*\n', '\n\n', text)

                if text.strip():  # Only add if there's content
                    doc = Document(
                        page_content=text,
                        metadata={"source": url, "title": title}
                    )
                    documents.append(doc)

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


def create_vector_store(docs):

    if not docs:
        print("No content found. Cannot create vector store.")
        return
    
    embeddings = OllamaEmbeddings(model=MODEL, base_url=OLLAMA_URL)

    print("Creating vector store...")

    db = FAISS.from_documents(docs, embeddings)

    db.save_local("vectorstore")

    print("Vector store created and saved.")


if __name__ == "__main__":

    url = "https://sahilsidhu.pro"

    docs = scrape_website(url)

    print(f"Scraped {len(docs)} pages")

    if docs:
        # Split documents into chunks
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            separators=["\n\n", "\n", " ", ""]
        )
        chunked_docs = text_splitter.split_documents(docs)

        print(f"Created {len(chunked_docs)} chunks")

        create_vector_store(chunked_docs)

        print("Index created successfully")
    else:
        print("No documents scraped.")