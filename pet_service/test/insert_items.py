import requests

url = "http://127.0.0.1:8000/items/insert"

items = [
        {"itemId": 1, "name": "Smores", "itemType": "food", "price": 20},
        {"itemId": 2, "name": "Football", "itemType": "toy", "price": 50},
        {"itemId": 3, "name": "Blue Hoodie", "itemType": "clothes", "price": 100},
    ]

response = requests.post(url, json=items)
print(response.status_code)
print(response.text)