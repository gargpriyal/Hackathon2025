import requests

url = "http://127.0.0.1:8000/flashcards/insert"
data = [
    {
        "question": "Who is the coolest guy?",
        "options": ["Priyal", "Chetan", "Christo"],
        "topicId": "12345",
        "spaceId": "67890",
        "correctOption": 0
    },
    {
        "question": "What table has the coolest team at HackRU?",
        "options": ["Table 99", "Table 67", "Table 24"],
        "topicId": "54321",
        "spaceId": "09876",
        "correctOption": 2
    },
    {
        "question": "What is 2 + 2?",
        "options": ["3", "4", "5"],
        "topicId": "11111",
        "spaceId": "22222",
        "correctOption": 1
    }
]

response = requests.post(url, json={"flashcards": data})
print(response.status_code)
print(response.text)
