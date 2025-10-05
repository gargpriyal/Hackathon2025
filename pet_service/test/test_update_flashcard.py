import requests

BASE = "http://127.0.0.1:8000"

# Replace with an existing flashcard _id from your database
flashcard_id = "68e20b148b78b99940b3892e"

# Example flashcard update
flashcard_update = {
    "_id": "68e20b148b78b99940b3892e",
    "question": "What is 3 + 5?",
    "options": ["6", "7", "8", "9"],
    "correctOption": 2,
    "category": "Math",
    "topicId": "12345",
    "spaceId": "67890"
}


url = f"{BASE}/flashcards/update"
payload = {"flashcard": flashcard_update}

resp = requests.post(url, json=payload)

print("Status code:", resp.status_code)
print("Response:", resp.json())