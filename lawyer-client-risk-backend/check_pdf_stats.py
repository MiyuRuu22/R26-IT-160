import pandas as pd

df = pd.read_csv(
    "app/data/processed/all_docs_validated.csv",
    dtype=str
).fillna("")

print("Total rows:", len(df))

print("\nPDF Status Count:")
print(df["pdf_status"].value_counts())

valid_count = (df["pdf_status"] == "valid").sum()
invalid_count = (df["pdf_status"] == "invalid").sum()

print("\nValid PDFs:", valid_count)
print("Invalid PDFs:", invalid_count)