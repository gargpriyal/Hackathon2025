import requests

BASE = "http://127.0.0.1:8000"

# This test ONLY calls /users/answer. Ensure the referenced userId and flashcardId
# already exist in your database before running the test.
answer_url = f"{BASE}/users/answer"
# adjust these values to match existing records in your DB
payload = {"userId": "68e1f7697d8c1deff631e9ba", "flashcardId": "68e20b148b78b99940b3892c", "optionSelected": 0}

resp = requests.post(answer_url, json=payload)
print(resp.status_code)
print(resp.text)
