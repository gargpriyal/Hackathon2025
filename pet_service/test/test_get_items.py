import requests

BASE = "http://127.0.0.1:8000"

# Only test the GET /inventory endpoint. Set userId to an existing user in your DB.

url = f"{BASE}/items"
resp = requests.get(url)
print(resp.status_code)
print(resp.text)

import sys

# Test GET /items filtering by itemType=FOOD
url = f"{BASE}/items"
params = {"itemType": "FOOD"}

resp = requests.get(url, params=params)
print("status:", resp.status_code)
if resp.status_code != 200:
	print(resp.text)
	sys.exit(1)

try:
	data = resp.json()
except Exception:
	print("response not JSON:\n", resp.text)
	sys.exit(1)

items = data.get("items", [])
print(f"returned {len(items)} items")

all_food = True
for it in items:
	it_type = (it.get("itemType") or "").upper()
	if it_type != "FOOD":
		print("unexpected itemType:", it.get("itemType"), it)
		all_food = False

if all_food:
	print("Filter appears to work: all returned items are FOOD")
else:
	print("Filter failed: some items are not FOOD")
	sys.exit(2)

