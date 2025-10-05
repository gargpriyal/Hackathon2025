from bson import ObjectId
from fastapi import APIRouter, HTTPException, Request, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List
from pydantic import ValidationError, TypeAdapter
from deps import get_db
from models import Flashcard

router = APIRouter()


@router.get("/flashcards")
async def get_flashcards(request: Request, db: AsyncIOMotorDatabase = Depends(get_db)):
    try:
        # accept multiple possible query names for compatibility
        topic = request.query_params.get("topicId")
        project = request.query_params.get("spaceId")

        query = {}
        if topic:
            query["topicId"] = topic
        elif project:
            query["spaceId"] = project

        cursor = db.flashcards.find(query)
        flashcards = []
        async for fc in cursor:
            if fc.get("_id") is not None:
                try:
                    fc["_id"] = str(fc["_id"])
                except Exception:
                    pass
            flashcards.append(fc)

        return {"flashcards": flashcards}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/flashcards/insert")
async def insert_flashcards(request: Request, db: AsyncIOMotorDatabase = Depends(get_db)):
    try:
        body = await request.json()

        if isinstance(body, dict) and "flashcards" in body:
            raw = body["flashcards"]
        else:
            raw = body

        try:
            flashcards = TypeAdapter(List[Flashcard]).validate_python(raw)
        except ValidationError as ve:
            raise HTTPException(status_code=422, detail=ve.errors())

        docs = [fc.model_dump() for fc in flashcards]
        result = await db.flashcards.insert_many(docs)
        return {"inserted_ids": [str(id) for id in result.inserted_ids]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@router.post("/flashcards/update")
async def update_flashcard(request: Request, db: AsyncIOMotorDatabase = Depends(get_db)):
    body = await request.json()

    if "flashcard" in body:
        raw = body["flashcard"]
    else:
        raw = body

    fc_id = raw.get("_id")
    if not fc_id:
        raise HTTPException(status_code=422, detail="Flashcard _id is required")

    raw_data = raw.copy()
    raw_data.pop("_id")
    flashcard = Flashcard(**raw_data)

    await db.flashcards.update_one({"_id": ObjectId(fc_id)}, {"$set": flashcard.model_dump()})

    return {"updated_id": fc_id}