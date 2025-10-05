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
    topicId: str 
    spaceId: str


class User(BaseModel):
    userId: int
    streak: int = 0
    coins: int = 0


class PetData(BaseModel):
    name: str 
    happinessLevel: int = 0
    hungerLevel: int = 50
    

class Items(BaseModel):
    name: str
    itemType: str
    price: int


class UserInventory(BaseModel):
    userId: int
    itemId: int
    quantity: int
