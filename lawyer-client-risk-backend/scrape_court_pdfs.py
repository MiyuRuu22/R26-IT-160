import re
import pandas as pd
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from playwright.sync_api import sync_playwright

START_YEAR = 2009
END_YEAR = 2026

appeal_base = "http://judgements.courtofappeal.lk/"
supreme_base = "https://supremecourt.lk/"


def extract_pdf_links_from_page(page, url, court, year):
    print(f"Checking {court} {year}: {url}")

    try:
        page.goto(url, wait_until="networkidle", timeout=60000)
    except Exception as e:
        print("Page load failed:", e)
        return []

    html = page.content()
    soup = BeautifulSoup(html, "html.parser")

    records = []

    for a in soup.find_all("a", href=True):
        href = a["href"]

        if ".pdf" not in href.lower():
            continue

        pdf_url = urljoin(url, href)
        text = a.get_text(" ", strip=True)

        records.append({
            "court": court,
            "year": year,
            "date": "",
            "case_number": text,
            "title": text,
            "pdf_url": pdf_url,
        })

    return records


def scrape_appeal_court(page):
    all_records = []

    # Court of Appeal pages may use year/archive pages.
    # Start from the main judgement page and collect all PDF links found.
    main_pages = [
        "http://judgements.courtofappeal.lk/?page_id=15595",
        "http://judgements.courtofappeal.lk/",
    ]

    for url in main_pages:
        for year in range(START_YEAR, END_YEAR + 1):
            records = extract_pdf_links_from_page(
                page,
                url,
                "Court of Appeal",
                year
            )
            all_records.extend(records)

    return all_records


def scrape_supreme_court(page):
    all_records = []

    # Supreme Court judgement pages may differ by site structure.
    possible_pages = [
        "https://supremecourt.lk/",
        "https://supremecourt.lk/judgements/",
        "https://www.supremecourt.lk/",
    ]

    for url in possible_pages:
        for year in range(START_YEAR, END_YEAR + 1):
            records = extract_pdf_links_from_page(
                page,
                url,
                "Supreme Court",
                year
            )
            all_records.extend(records)

    return all_records


def clean_and_filter(records):
    df = pd.DataFrame(records)

    if df.empty:
        return df

    df = df.drop_duplicates(subset=["pdf_url"])

    # Keep only PDF links from 2009 to 2026 if year appears in URL/text.
    # Some sites do not expose date clearly, so this is soft filtering.
    df["pdf_url_lower"] = df["pdf_url"].str.lower()

    df = df[
        df["pdf_url_lower"].str.contains(".pdf", regex=False)
    ]

    df = df.drop(columns=["pdf_url_lower"])

    return df


def main():
    all_records = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(
            user_agent="Mozilla/5.0"
        )

        all_records.extend(scrape_appeal_court(page))
        all_records.extend(scrape_supreme_court(page))

        browser.close()

    df = clean_and_filter(all_records)

    df.to_csv("court_pdf_links_2009_2026.csv", index=False)

    print("Done")
    print("Total PDF links:", len(df))
    print("Saved: court_pdf_links_2009_2026.csv")


if __name__ == "__main__":
    main()