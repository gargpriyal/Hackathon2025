import requests

BASE = "http://127.0.0.1:8000"

# Replace with an existing userId in your MongoDB
userId = "68e1f7697d8c1deff631e9ba"

url = f"{BASE}/pets/create"

# The body to send to FastAPI
pet_data = {
    "name": "Snowball",
    "color": "White",
    "userId": userId
}

# Send POST request
resp = requests.post(url, json=pet_data)

# Print results
print("Status Code:", resp.status_code)
print("Response Body:", resp.text)
