import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
)

from app.ml.feature_engineering import (
    build_case_features,
    assign_training_label,
)

from app.services.dataset_loader import load_local_dataset
from app.services.search_service import (
    extract_primary_client_name,
    normalize_name_key,
    is_valid_client_name,
    infer_case_type,
)

from collections import defaultdict


df = load_local_dataset()

clients = defaultdict(list)

# GROUP CASES BY CLIENT
for _, row in df.iterrows():

    parties = str(row.get("parties", ""))

    name = extract_primary_client_name(parties)

    if not is_valid_client_name(name):
        continue

    key = normalize_name_key(name)

    case = {
        "type": infer_case_type(
            row.get("description", "")
        ),
        "description": row.get("description", ""),
        "parties": parties,
        "date": row.get("date_str", ""),
    }

    clients[key].append(case)

# BUILD FEATURE DATASET
rows = []

for key, cases in clients.items():

    features = build_case_features(cases, key)

    label = assign_training_label(features)

    features["label"] = label

    rows.append(features)

dataset = pd.DataFrame(rows)

print("Dataset size:", len(dataset))

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

X = dataset[feature_cols]
y = dataset["label"]

# TRAIN / TEST SPLIT
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
)

# MODEL
model = RandomForestClassifier(
    n_estimators=200,
    max_depth=8,
    random_state=42,
)

model.fit(X_train, y_train)

# PREDICT
y_pred = model.predict(X_test)

# RESULTS
accuracy = accuracy_score(y_test, y_pred)

print("\nAccuracy:")
print(round(accuracy * 100, 2), "%")

print("\nClassification Report:")
print(classification_report(y_test, y_pred))

print("\nConfusion Matrix:")
print(confusion_matrix(y_test, y_pred))