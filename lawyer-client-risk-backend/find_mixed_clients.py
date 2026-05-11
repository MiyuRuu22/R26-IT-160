from collections import defaultdict
from app.services.dataset_loader import load_local_dataset
from app.services.search_service import (
    extract_primary_client_name,
    normalize_name_key,
    is_valid_client_name,
    infer_case_type,
)

df = load_local_dataset()

clients = defaultdict(lambda: {"name": "", "types": defaultdict(int), "total": 0})

for _, row in df.iterrows():
    parties = str(row.get("parties", ""))
    description = str(row.get("description", ""))

    name = extract_primary_client_name(parties)

    if not is_valid_client_name(name):
        continue

    key = normalize_name_key(name)

    case_type = infer_case_type(description)

    clients[key]["name"] = name
    clients[key]["types"][case_type] += 1
    clients[key]["total"] += 1

mixed = []

for key, data in clients.items():
    non_zero_types = [t for t, c in data["types"].items() if c > 0]

    if len(non_zero_types) >= 2:
        mixed.append(data)

mixed = sorted(mixed, key=lambda x: x["total"], reverse=True)

print("Mixed clients found:", len(mixed))

for item in mixed[:30]:
    print(
        item["name"],
        "| Total:",
        item["total"],
        "| Civil:",
        item["types"].get("Civil", 0),
        "| Criminal:",
        item["types"].get("Criminal", 0),
        "| Commercial:",
        item["types"].get("Commercial", 0),
    )