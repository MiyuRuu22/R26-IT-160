import json

from extraction.pdf_reader import process_all_pdfs
from extraction.entity_extractor import extract_all
from extraction.neo4j_loader import load_case
from extraction.conflict_detector import (
    detect_repeat_respondents,
    detect_shared_organizations,
    calculate_risk_scores
)

PDF_FOLDER = "data/pdfs"

print("=" * 60)
print("LEGAL CONFLICT DETECTION PIPELINE")
print("=" * 60)

# Step 1: Process PDFs
print("\n[1/4] Reading PDFs...")
all_pdfs = process_all_pdfs(PDF_FOLDER)
print(f"✓ Processed {len(all_pdfs)} PDFs")

# Step 2: Extract entities
print("\n[2/4] Extracting entities from text...")
results = []
for pdf in all_pdfs:
    extracted = extract_all(pdf["text"])
    results.append(extracted)
    load_case(extracted)
print(f"✓ Extracted entities from all PDFs")

# Step 3: Detect conflicts
print("\n[3/4] Detecting conflicts of interest...")
repeat_respondents = detect_repeat_respondents()
shared_orgs = detect_shared_organizations()
risk_scores = calculate_risk_scores()

conflicts = {
    "repeat_respondents": repeat_respondents,
    "shared_organizations": shared_orgs,
    "risk_analysis": risk_scores
}
print(f"✓ Found {len(repeat_respondents)} repeat respondents")
print(f"✓ Found {len(shared_orgs)} organizations with multiple cases")

# Step 4: Save results
print("\n[4/4] Saving results...")
with open("output/cases.json", "w") as f:
    json.dump(results, f, indent=4)

with open("output/conflicts.json", "w") as f:
    json.dump(conflicts, f, indent=4)

print("✓ Results saved to output/")

print("\n" + "=" * 60)
print("Pipeline completed successfully!")
print("=" * 60)