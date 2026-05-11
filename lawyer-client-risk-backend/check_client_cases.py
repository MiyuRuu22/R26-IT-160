from app.services.dataset_loader import load_local_dataset
from app.services.search_service import (
    extract_primary_client_name,
    normalize_name_key,
    infer_case_type,
)

TARGET = "Hewa Aluth Sahal Arachchige Ajith Prasanna"

df = load_local_dataset()
target_key = normalize_name_key(TARGET)

matches = []

for _, row in df.iterrows():
    parties = str(row.get("parties", ""))
    description = str(row.get("description", ""))

    name = extract_primary_client_name(parties)
    name_key = normalize_name_key(name)

    if name_key == target_key:
        matches.append({
            "name": name,
            "case": row.get("num", ""),
            "date": row.get("date_str", ""),
            "type": infer_case_type(description),
            "description": description[:120],
        })

print("Total exact name matches:", len(matches))

for m in matches:
    print(m)