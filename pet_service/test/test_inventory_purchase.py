import requests

url = "http://127.0.0.1:8000/inventory/purchase"
# adjust userId/itemId to an existing user/item in your DB before running
data = { "userId": "68e1f774023ee7972dddcad1", "itemId": "68e1fc255541be58348adc48", "quantity": 1 }

response = requests.post(url, json=data)
print(response.status_code)
print(response.text)
