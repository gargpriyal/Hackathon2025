import requests

url = "http://127.0.0.1:8000/items/insert"

items = [
        {"name": "Pizza", "itemType": "FOOD", "price": 10, "statsIncrease": 5},
        {"name": "Octopus Plush", "itemType": "TOYS", "price": 70, "statsIncrease": 5},
        {"name": "Sunglasses", "itemType": "CLOTHING", "price": 30, "statsIncrease": 0},
    ]

response = requests.post(url, json=items)
print(response.status_code)
print(response.text)