import requests

url = "http://127.0.0.1:8000/flashcards/insert"
data = [
    {
        "question": "What's the capital of France?",
        "options": ["Berlin", "Paris", "London"],
        "topicId": "12345",
        "spaceId": "67890",
        "correctOption": 0
    }
]

response = requests.post(url, json={"flashcards": data})
print(response.status_code)
print(response.text)
