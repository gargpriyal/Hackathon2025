from pydantic import BaseModel
from typing import List

food = "FOOD"
clothing = "CLOTHING"
toys = "TOYS"

streak = "streak"
coins = "coins"

class Flashcard(BaseModel):
    question: str
    options: List[str]
    correctOption: int
    topicId: object 
    spaceId: object


class User(BaseModel):
    userId: object
    streak: int = 0
    coins: int = 0


class PetData(BaseModel):
    name: str 
    color: str
    happinessLevel: int = 0
    energyLevel: int = 50
    userId: object
    

class Items(BaseModel):
    name: str
    itemType: str
    price: int


class UserInventory(BaseModel):
    userId: object
    itemId: object
    quantity: int
