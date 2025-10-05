from fastapi import APIRouter, HTTPException, Request, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, ValidationError
from deps import get_db
from bson import ObjectId
from models import streak, coins

router = APIRouter()


@router.post("/users/insert")
async def insert_user(request: Request, db: AsyncIOMotorDatabase = Depends(get_db)):
    try:
        user = await request.json()
        if not isinstance(user, dict):
            raise HTTPException(status_code=422, detail="Invalid body; expected a user object")

        user[streak] = int(user.get(streak, 0))
        user[coins] = int(user.get(coins, 0))

        result = await db.users.insert_one(user)
        return {"inserted_id": str(result.inserted_id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/users/answer")
async def answer_question(request: Request, db: AsyncIOMotorDatabase = Depends(get_db)):
    try:
        body = await request.json()
        try:
            class AnswerRequest(BaseModel):
                userId: str
                flashcardId: str
                optionSelected: int

            req = AnswerRequest.model_validate(body)
        except ValidationError as ve:
            raise HTTPException(status_code=422, detail=ve.errors())

        userId = ObjectId(req.userId)
        flashcardId = ObjectId(req.flashcardId)
        optionSelected = req.optionSelected

        flashcard = await db.flashcards.find_one({"_id": flashcardId})
        if flashcard is None:
            raise HTTPException(status_code=404, detail="Flashcard not found")

        user = await db.users.find_one({"_id": userId})
        if user is None:
            raise HTTPException(status_code=404, detail="User not found")

        correct = flashcard.get("correctOption")
        if correct is None:
            raise HTTPException(status_code=500, detail="Flashcard missing 'correctOption' field")

        if correct == optionSelected:
            new_streak = user.get(streak, 0) + 1
            if new_streak % 5 == 0:
                new_coins = user.get(coins, 0) + 50
            else:
                new_coins = user.get(coins, 0) + 10
            await db.users.update_one({"_id": userId}, {"$set": {streak: new_streak, coins: new_coins}})
            return {"result": "correct", streak: new_streak, coins: new_coins}
        else:
            await db.users.update_one({"_id": userId}, {"$set": {streak: 0}})
            return {"result": "incorrect", streak: 0, coins: user.get(coins, 0)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
