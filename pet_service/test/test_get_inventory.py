import requests

BASE = "http://127.0.0.1:8000"

# Only test the GET /inventory endpoint. Set userId to an existing user in your DB.
userId = "68e1f779dc6d82796f3b3f45"

url = f"{BASE}/inventory?userId={userId}"
resp = requests.get(url)
print(resp.status_code)
print(resp.text)

