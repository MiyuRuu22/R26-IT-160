import os
import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
from app.services.dataset_loader import load_local_dataset
from app.ml.feature_engineering import build_case_features, assign_training_label

MODEL_DIR = "app/data/models"
MODEL_PATH = os.path.join(MODEL_DIR, "risk_model.pkl")


def group_cases_by_party(df: pd.DataFrame):
    grouped_clients = {}

    for _, row in df.iterrows():
        parties = str(row.get("parties", "")).strip()
        if not parties:
            continue

        client_key = parties[:160]

        if client_key not in grouped_clients:
            grouped_clients[client_key] = []

        grouped_clients[client_key].append({
            "id": row.get("doc_id", ""),
            "title": row.get("num", ""),
            "date": row.get("date_str", ""),
            "description": row.get("description", ""),
            "parties": row.get("parties", ""),
            "pdf_url": row.get("url_pdf", ""),
            "source": row.get("source", ""),
            "type": "Civil",
        })

    return grouped_clients


def infer_case_type_for_grouped_cases(case):
    text = str(case.get("description", "")).lower()
    if "criminal" in text or "conviction" in text or "offence" in text or "attorney general" in text:
        return "Criminal"
    if "commercial" in text or "company" in text or "contract" in text or "insurance" in text:
        return "Commercial"
    return "Civil"


def build_training_dataframe():
    df = load_local_dataset()
    grouped = group_cases_by_party(df)

    rows = []

    for client_name, cases in grouped.items():
        for case in cases:
            case["type"] = infer_case_type_for_grouped_cases(case)

        features = build_case_features(cases, client_name)
        label = assign_training_label(features)

        rows.append({
            **features,
            "label": label,
        })

    return pd.DataFrame(rows)


def train():
    df = build_training_dataframe()

    feature_cols = [
        "case_count",
        "civil_count",
        "criminal_count",
        "commercial_count",
        "max_severity",
        "avg_severity",
        "conflict_count",
        "recent_case_count",
    ]

    X = df[feature_cols]
    y = df["label"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=8,
        random_state=42
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)

    print("Accuracy:", accuracy_score(y_test, y_pred))
    print(classification_report(y_test, y_pred))

    os.makedirs(MODEL_DIR, exist_ok=True)
    joblib.dump({
        "model": model,
        "feature_cols": feature_cols
    }, MODEL_PATH)

    print(f"Model saved to {MODEL_PATH}")


if __name__ == "__main__":
    train()