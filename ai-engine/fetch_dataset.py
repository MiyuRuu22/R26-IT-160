import requests
import json

url = "https://raw.githubusercontent.com/nuuuwan/lk_appeal_court_judgements/main/README.md"

response = requests.get(url)

print(response.text)