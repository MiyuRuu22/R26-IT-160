import pandas as pd

# Load validated dataset
df = pd.read_csv(
    "app/data/processed/all_docs_validated.csv",
    dtype=str
).fillna("")

# Keep only valid PDFs
clean_df = df[df["pdf_status"] == "valid"]

# Save clean dataset
clean_df.to_csv(
    "app/data/processed/all_docs_clean.csv",
    index=False
)

print("Clean dataset created.")
print("Total valid rows:", len(clean_df))