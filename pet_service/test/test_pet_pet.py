import requests

BASE = "http://127.0.0.1:8000"

# Replace with an actual pet _id from your database
pet_id = "68e2250eded1e8ae52ff0067"

url = f"{BASE}/pets/pet"
payload = {"petId": pet_id}

resp = requests.post(url, json=payload)

print("Status code:", resp.status_code)
print("Response:", resp.json())