import pandas as pd
import requests

# Load CSV
df = pd.read_csv("app/data/processed/all_docs.csv")

# Create new columns
df["validated_pdf_url"] = ""
df["pdf_status"] = "invalid"


def validate_pdf(url):
    try:
        response = requests.get(
            url,
            timeout=8,
            allow_redirects=True,
            headers={
                "User-Agent": "Mozilla/5.0"
            }
        )

        content_type = response.headers.get(
            "content-type",
            ""
        ).lower()

        final_url = response.url.lower()

        # valid real PDF
        if "application/pdf" in content_type:
            return response.url, "valid"

        # reject redirected HTML/homepages
        if "text/html" in content_type:
            return "", "invalid"

        # fallback for direct .pdf links
        if final_url.endswith(".pdf"):
            return response.url, "valid"

        return "", "invalid"

    except Exception:
        return "", "invalid"


# TEST FIRST 100 ROWS
for index, row in df.head(3000).iterrows():

    old_url = str(row.get("url_pdf", "")).strip()

    print(f"\nChecking row {index}")
    print(old_url)

    valid_url, status = validate_pdf(old_url)

    df.at[index, "validated_pdf_url"] = valid_url
    df.at[index, "pdf_status"] = status

    print("STATUS:", status)


# Save NEW CSV
df.to_csv(
    "app/data/processed/all_docs_validated.csv",
    index=False
)

print("\nValidation complete.")