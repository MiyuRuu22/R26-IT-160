import urllib.request, json

body = json.dumps({"question": "fraud case involving property"}).encode()
req = urllib.request.Request(
    "http://127.0.0.1:8000/search",
    data=body,
    headers={"Content-Type": "application/json"},
    method="POST",
)
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read())

status = data["status"]
total  = data["total_results"]
print(f"Status: {status}  |  Total results: {total}\n")

for i, r in enumerate(data["results"], 1):
    act      = r["act_name"]
    section  = r["section"]
    title    = r["section_title"]
    category = r["category"]
    score    = r["similarity_score"]
    snippet  = r["law_text"][:120]
    print(f"[{i}] {act}  s.{section} - {title}")
    print(f"     Category: {category}  |  Score: {score}")
    print(f"     {snippet}...")
    print()
