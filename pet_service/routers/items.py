from fastapi import APIRouter, HTTPException, Request, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List
from pydantic import ValidationError, TypeAdapter
from deps import get_db
from models import Items, food, clothing, toys

router = APIRouter()

@router.get("/items")
async def get_items(request: Request, db: AsyncIOMotorDatabase = Depends(get_db)):
    try:
        item_type = request.query_params.get("itemType")
        if item_type:
            cursor = db.items.find({"itemType": item_type})
            items = []
            async for item in cursor:
                if item.get("_id") is not None:
                    try:
                        item["_id"] = str(item["_id"])
                    except Exception:
                        pass
                items.append(item)
            return {"items": items}

        # group by category: food, clothes, toys
        categories = {food: [], clothing: [], toys: []}
        cursor = db.items.find()
        async for item in cursor:
            if item.get("_id") is not None:
                try:
                    item["_id"] = str(item["_id"])
                except Exception:
                    pass
            t = item.get("itemType", toys)
            key = toys if t not in (food, clothing, toys) else t
            categories[key].append(item)

        return {food: categories[food], clothing: categories[clothing], toys: categories[toys]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@router.post("/items/insert")
async def insert_items(request: Request, db: AsyncIOMotorDatabase = Depends(get_db)):
    try:
        body = await request.json()
        if isinstance(body, dict) and "items" in body:
            raw = body["items"]
        else:
            raw = body

        try:
            items = TypeAdapter(List[Items]).validate_python(raw)
        except ValidationError as ve:
            raise HTTPException(status_code=422, detail=ve.errors())

        docs = [it.model_dump() for it in items]
        result = await db.items.insert_many(docs)
        return {"inserted_count": len(result.inserted_ids)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

