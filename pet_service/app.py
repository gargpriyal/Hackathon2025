from fastapi import FastAPI, HTTPException, Depends, Request
from pymongo import AsyncMongoClient
from db import get_connection, close_connection

async def get_db():
    db = get_connection()
    try:
        yield db
    finally:
        await close_connection(db)

app = FastAPI()

@app.get("/health")
def check_health():
    return {"status": "ok"}

@app.get("/db_status")
def check_db_status(db: AsyncMongoClient = Depends(get_db)):
    return {"status": "ok"}

@app.get("/pets/{pet_id}")
async def get_pet(pet_id: str, db: AsyncMongoClient = Depends(get_db)):
    try:
        pet = await db.pets.find_one({"_id": pet_id})
        if pet is None:
            raise HTTPException(status_code=404, detail="Pet not found")
        return pet
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/pets")
async def create_pet(pet: dict, db: AsyncMongoClient = Depends(get_db)):
    try:
        result = await db.pets.insert_one(pet)
        return {"inserted_id": str(result.inserted_id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    
    
# accepts a list of flashcards to insert into the flashcards collection    
@app.post("/flashcards/insert")
async def insert_flashcards(flashcards: list, db: AsyncMongoClient = Depends(get_db)):
    try:
        result = await db.flashcards.insert_many(flashcards)
        return {"inserted_ids": [str(id) for id in result.inserted_ids]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))




@app.post("/user/answer")
async def answer_question(userId: int, flashcardId: int, optionSelected: int, db: AsyncMongoClient = Depends(get_db)):    
    try:
        flashcard = await db.flashcards.find_one({"_id": flashcardId})
        if flashcard is None:
            raise HTTPException(status_code=404, detail="Flashcard not found")
        
        user = await db.users.find_one({"_id": userId})
        if user is None:
            raise HTTPException(status_code=404, detail="User not found")
        
        if flashcard.correct_option == optionSelected:
            new_streak = user.get("streak", 0) + 1
            if new_streak % 5 == 0:
                new_coins = user.get("coins", 0) + 50
            else:
                new_coins = user.get("coins", 0) + 10
            db.users.update_one({"_id": userId}, {"$set": {"streak": new_streak, "coins": new_coins}})
        
        else:
            db.users.update_one({"_id": userId}, {"$set": {"streak": 0}})
        
        return flashcard.correct_option
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    