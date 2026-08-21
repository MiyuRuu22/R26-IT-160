import urllib.request, json

req = urllib.request.Request(
    'http://localhost:8000/search',
    data=json.dumps({'question': 'Alleged drug trafficking and criminal conspiracy', 'top_k': 3}).encode(),
    headers={'Content-Type': 'application/json'},
    method='POST'
)
with urllib.request.urlopen(req) as r:
    data = json.loads(r.read())

print('Issue     :', data['detected_case_type'], '-', data['detected_label'])
print('Confidence:', round(data['confidence'] * 100), '%')
print('Mode      :', data['search_mode'])
print('Filter    :', data['laws_in_filter'], 'laws in', data['filtered_category'])
print('Keywords  :', data['matched_keywords'])
print()
for i, result in enumerate(data['results']):
    cat = result['category']
    name = result['act_name'][:70]
    score = round(result['similarity_score'] * 100)
    print(f'  {i+1}. [{cat}] {name} ({score}%)')
