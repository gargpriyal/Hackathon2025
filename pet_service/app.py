from fastapi import FastAPI, HTTPException, Depends, Request
from motor.motor_asyncio import AsyncIOMotorDatabase
from db import get_connection, close_connection
from pydantic import BaseModel, ValidationError, TypeAdapter
from typing import List
from bson import ObjectId

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
    hungerLevel: int = 50 # default is half 
    
class Items(BaseModel):
    itemId: int
    name: str
    itemType: str
    price: int

class UserInventory(BaseModel):
    userId: int
    itemId: int # foregin key to Items.itemId
    quantity: int

async def get_db():
    db = get_connection()
    try:
        yield db
    finally:
        await close_connection(db)

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI!"}

@app.get("/health")
def check_health():
    return {"status": "ok"}

@app.get("/db_status")
def check_db_status(db: AsyncIOMotorDatabase = Depends(get_db)):
    return {"status": "ok"}

@app.get("/pets/{pet_id}")
async def get_pet(pet_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    try:
        pet = await db.pets.find_one({"_id": pet_id})
        if pet is None:
            raise HTTPException(status_code=404, detail="Pet not found")
        return pet
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/pets/create")
async def create_pet(pet: dict, db: AsyncIOMotorDatabase = Depends(get_db)):
    try:
        result = await db.pets.insert_one(pet)
        return {"inserted_id": str(result.inserted_id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    
# accepts a list of flashcards to insert into the flashcards collection
@app.post("/flashcards/insert")
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




@app.post("/users/insert")
async def insert_user(request: Request, db: AsyncIOMotorDatabase = Depends(get_db)):
    try:
        user = await request.json()
        if not isinstance(user, dict):
            raise HTTPException(status_code=422, detail="Invalid body; expected a user object")
        # ensure streak and coins are present and default to 0
        user[streak] = int(user.get(streak, 0))
        user[coins] = int(user.get(coins, 0))

        result = await db.users.insert_one(user)
        return {"inserted_id": str(result.inserted_id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

        
@app.post("/users/answer")
async def answer_question(request: Request, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Validate request body and update user's streak/coins when answering a flashcard.

    Expected JSON: { "userId": <id>, "flashcardId": <id>, "optionSelected": <int> }
    """
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

        # flashcard documents use 'correctOption' (zero-based index)
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
    
    
@app.post("/inventory/purchase")
async def purchase_item(request: Request, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Purchase an item. Expects JSON body: { userId, itemId, quantity? }

    Validates input with Pydantic and updates user's coins and inventory atomically per request.
    """
    try:
        body = await request.json()
        try:
            class PurchaseRequest(BaseModel):
                userId: str
                itemId: str
                quantity: int = 1

            purchase = PurchaseRequest.model_validate(body)
        except ValidationError as ve:
            raise HTTPException(status_code=422, detail=ve.errors())

        userId = ObjectId(purchase.userId)
        itemId = ObjectId(purchase.itemId)
        quantity = int(purchase.quantity)

        item = await db.items.find_one({"_id": itemId})
        if item is None:
            raise HTTPException(status_code=404, detail="Item not found")

        user = await db.users.find_one({"_id": userId})
        if user is None:
            raise HTTPException(status_code=404, detail="User not found")

        user_coins = int(user.get(coins, 0))
        item_price = int(item.get("price", 0))
        total_cost = item_price * quantity

        if user_coins < total_cost:
            raise HTTPException(status_code=400, detail="Insufficient coins")

        new_coins = user_coins - total_cost
        await db.users.update_one({"_id": userId}, {"$set": {coins: new_coins}})

        inventory_entry = await db.inventory.find_one({"userId": userId, "itemId": itemId})
        if inventory_entry:
            inventory_id = inventory_entry["_id"]
            new_quantity = inventory_entry.get("quantity", 0) + quantity
            await db.inventory.update_one({"_id": inventory_id}, {"$set": {"quantity": new_quantity}})
        else:
            await db.inventory.insert_one({"userId": userId, "itemId": itemId, "quantity": quantity})

        return {"message": "Purchase successful", "remaining_coins": new_coins}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/inventory")
async def get_inventory(request: Request, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get user inventory. Expects query param: userId

    Returns list of items and quantities for the user.
    """
    try:
        userId = request.query_params.get("userId")
        if userId is None:
            raise HTTPException(status_code=422, detail="Missing userId query parameter")

        inventory_cursor = db.inventory.find({"userId": userId})
        inventory = []
        async for entry in inventory_cursor:
            # stringify inventory entry _id for the response
            inv_id = entry.get("_id")
            if inv_id is not None:
                try:
                    inv_id = str(inv_id)
                except Exception:
                    pass

            # find the item document referenced by this inventory entry
            item = await db.items.find_one({"itemId": entry.get("itemId")})
            if item is None:
                # skip entries that reference missing items
                continue

            # serialize ObjectId fields in the item doc
            if item.get("_id") is not None:
                try:
                    item["_id"] = str(item["_id"])
                except Exception:
                    pass

            # build the response entry with the inventory id, item and quantity
            inventory.append({
                "inventoryId": inv_id,
                "item": item,
                "quantity": int(entry.get("quantity", 0))
            })

        return {"userId": userId, "inventory": inventory}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# DO NOT EXPOSE - only for internal
@app.post("/items/insert")
async def insert_items(request: Request, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Insert multiple items.

    Accepts either a raw JSON list or an object with an "items" key.
    Validates each item with the Items Pydantic model.
    """
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

@app.get("/flashcards")
async def get_flashcards(request: Request, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get flashcards. If query param project or param topic is provided, filter.

    If none are provided, return all flashcards
    """
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
            # stringify ObjectId for JSON
            if fc.get("_id") is not None:
                try:
                    fc["_id"] = str(fc["_id"])
                except Exception:
                    pass
            flashcards.append(fc)

        return {"flashcards": flashcards}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
            
@app.get("/items")
async def get_items(request: Request, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get items. If query param itemType is provided, filter by that type.

    If no itemType is provided, return grouped items under keys: food, clothes, toys.
    """
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

        # normalize key name 'toy' to 'toys' in the response
        return {food: categories[food], clothing: categories[clothing], toys: categories[toys]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



