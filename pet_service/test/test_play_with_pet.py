import requests

BASE = "http://127.0.0.1:8000"

# Replace with actual IDs from your DB
pet_id = "68e2250eded1e8ae52ff0067"
user_id = "68e1f7697d8c1deff631e9ba"

# Food item object matching your DB schema
item_Id = "68e1fc255541be58348adc48"

url = f"{BASE}/pets/feed"
payload = {
    "petId": pet_id,
    "userId": user_id,
    "itemId": item_Id
}

resp = requests.post(url, json=payload)

print("Status code:", resp.status_code)
print("Response:", resp.json())
