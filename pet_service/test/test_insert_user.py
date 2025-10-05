import requests

url = "http://127.0.0.1:8000/users/insert"
data = { "userId": "Vishal" }


response = requests.post(url, json=data)
print(response.status_code)
print(response.text)
