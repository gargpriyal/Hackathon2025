import requests

url = "http://127.0.0.1:8000/inventory/purchase"
# adjust userId/itemId to an existing user/item in your DB before running
data = { "userId": "68e218483f112a5967f2bbe9", "itemId": "68e2174bfe51cc942993d2ca", "quantity": 1 }

response = requests.post(url, json=data)
print(response.status_code)
print(response.text)
