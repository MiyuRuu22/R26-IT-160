from datasets import load_dataset
import pandas as pd
from pathlib import Path

SUPREME_PATH = Path("app/data/processed/supreme_docs.csv")
APPEAL_PATH = Path("app/data/processed/appeal_docs.csv")
COMBINED_PATH = Path("app/data/processed/all_docs.csv")


def _fix_pdf_columns(df: pd.DataFrame) -> pd.DataFrame:
    if "url_pdf" not in df.columns:
        df["url_pdf"] = ""

    if "final_pdf_url" in df.columns:
        df["final_pdf_url"] = df["final_pdf_url"].fillna("").astype(str)

        df["url_pdf"] = df["final_pdf_url"].where(
            df["final_pdf_url"].str.strip() != "",
            df["url_pdf"]
        )

    df["url_pdf"] = df["url_pdf"].fillna("").astype(str)
    return df


def _prepare_df(df: pd.DataFrame, source_name: str) -> pd.DataFrame:
    keep_cols = [
        "doc_id",
        "num",
        "date_str",
        "description",
        "url_pdf",
        "final_pdf_url",
        "matched_pdf_url",
        "pdf_match_status",
        "pdf_match_method",
        "pdf_status",
        "validated_pdf_url",
        "parties",
        "judgement_by",
        "source",
    ]

    existing_cols = [c for c in keep_cols if c in df.columns]
    df = df[existing_cols].copy()

    for col in keep_cols:
        if col not in df.columns:
            df[col] = ""

    for col in keep_cols:
        df[col] = df[col].fillna("").astype(str)

    df = _fix_pdf_columns(df)

    if not df["source"].str.strip().any():
        df["source"] = source_name

    return df


def download_supreme_dataset() -> pd.DataFrame:
    print("Downloading Supreme Court dataset...")
    dataset = load_dataset("nuuuwan/lk-supreme-court-judgements-docs")
    df = dataset["train"].to_pandas()
    df = _prepare_df(df, "supreme")

    SUPREME_PATH.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(SUPREME_PATH, index=False)

    print(f"Saved Supreme Court dataset: {SUPREME_PATH} ({len(df)} rows)")
    return df


def download_appeal_dataset() -> pd.DataFrame:
    print("Downloading Appeal Court dataset...")
    dataset = load_dataset("nuuuwan/lk-appeal-court-judgements-docs")
    df = dataset["train"].to_pandas()
    df = _prepare_df(df, "appeal")

    APPEAL_PATH.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(APPEAL_PATH, index=False)

    print(f"Saved Appeal Court dataset: {APPEAL_PATH} ({len(df)} rows)")
    return df


def load_all_datasets() -> pd.DataFrame:
    if SUPREME_PATH.exists():
        print("Loading local Supreme Court dataset...")
        supreme_df = pd.read_csv(SUPREME_PATH, dtype=str).fillna("")
        supreme_df = _prepare_df(supreme_df, "supreme")
    else:
        supreme_df = download_supreme_dataset()

    if APPEAL_PATH.exists():
        print("Loading local Appeal Court dataset...")
        appeal_df = pd.read_csv(APPEAL_PATH, dtype=str).fillna("")
        appeal_df = _prepare_df(appeal_df, "appeal")
    else:
        appeal_df = download_appeal_dataset()

    combined = pd.concat([supreme_df, appeal_df], ignore_index=True).fillna("")
    combined = combined.astype(str)
    combined = _fix_pdf_columns(combined)

    COMBINED_PATH.parent.mkdir(parents=True, exist_ok=True)
    combined.to_csv(COMBINED_PATH, index=False)

    print(f"Saved combined dataset: {COMBINED_PATH} ({len(combined)} rows)")
    return combined


def load_local_dataset() -> pd.DataFrame:
    if COMBINED_PATH.exists():
        print("Loading all_docs.csv dataset...")
        df = pd.read_csv(COMBINED_PATH, dtype=str).fillna("")
        df = _prepare_df(df, "combined")
        return df

    return load_all_datasets()