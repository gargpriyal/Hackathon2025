import asyncio
from datetime import datetime, timedelta
from fastapi import APIRouter, Request, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from deps import get_db
from bson import ObjectId

router = APIRouter()


@router.get("/pets")
async def get_pets(request: Request, db: AsyncIOMotorDatabase = Depends(get_db)):
    try:
        user_id_str = request.query_params.get("userId")
        query = {}
        if user_id_str:
            try:
                query["userId"] = ObjectId(user_id_str)
            except Exception:
                raise HTTPException(status_code=400, detail="Invalid userId format")

        pet_data = await db.pets.find(query).to_list(length=None)

        pets = []
        for pet in pet_data:
            # Convert all ObjectIds to strings
            for key, value in pet.items():
                if isinstance(value, ObjectId):
                    pet[key] = str(value)
            pets.append(pet)

        return {"pets": pets}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

async def decrease_happiness_and_hunger(db: AsyncIOMotorDatabase):
    """Runs every hour to decrease happiness for pets not petted in 24h."""
    
    last_hunger_update = datetime.now()
    
    while True:
        try:
            now = datetime.now()
            twenty_four_hours_ago = now - timedelta(hours=24)
            cursor = db.pets.find({"last_pet_time": {"$lte": twenty_four_hours_ago}})

            async for pet in cursor:
                new_happiness = max(0, int(pet.get("happinessLevel", 0)) - 10)
                await db.pets.update_one(
                    {"_id": pet["_id"]},
                    {"$set": {"happinessLevel": new_happiness, "last_pet_time": now}},
                )
                print(f"😢 Decreased happiness for {pet.get('name')} to {new_happiness}")
                
            if (now - last_hunger_update) >= timedelta(hours=2):
                cursor = db.pets.find()
                async for pet in cursor:
                    new_hunger = max(0, int(pet.get("energyLevel")) - 5)
                    await db.pets.update_one(
                        {"_id": pet["_id"]},
                        {"$set": {"energyLevel": new_hunger}}
                    )
                    print(f"🍖 Decreased hunger for {pet.get('name')} to {new_hunger}")
                last_hunger_update = now
                
        except Exception as e:
            print("❌ Error in decrease_happiness_and_hunger:", e)

        await asyncio.sleep(3600)
    
@router.post("/pets/create")
async def create_pet(request: Request, db: AsyncIOMotorDatabase = Depends(get_db)):
    try:
        
        pet = await request.json()
        if not isinstance(pet, dict):
            raise HTTPException(status_code=422, detail="Invalid body; expected a pet object")
                
        pet["name"] = str(pet.get("name", "Unnamed Pet"))
        pet["color"] = str(pet.get("color", "Unknown Color"))
        pet["happinessLevel"] = int(pet.get("happinessLevel", 0))
        pet["energyLevel"] = int(pet.get("energyLevel", 50))
        pet["userId"] = ObjectId(pet.get("userId"))
        pet["last_pet_time"] = datetime.now()

        result = await db.pets.insert_one(pet)
        
        asyncio.create_task(decrease_happiness_and_hunger(db))
        
        return {"inserted_id": str(result.inserted_id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/pets/pet")
async def pet_pet(request: Request, db: AsyncIOMotorDatabase = Depends(get_db)):
    try:
        body = await request.json()
        pet_id_str = body.get("petId")
        if not pet_id_str:
            raise HTTPException(status_code=422, detail="petId is required")
        
        try:
            pet_id = ObjectId(pet_id_str)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid petId format")

        pet = await db.pets.find_one({"_id": pet_id})
        if pet is None:
            raise HTTPException(status_code=404, detail="Pet not found")

        last_pet_time = pet.get("last_pet_time")
        new_happiness = int(pet.get("happinessLevel", 0))

        if last_pet_time is not None and last_pet_time < datetime.now() - timedelta(hours=24):
            new_happiness += 5

        await db.pets.update_one(
            {"_id": pet_id},
            {"$set": {"happinessLevel": new_happiness, "last_pet_time": datetime.now()}}
        )

        return {"message": "Pet petted successfully", "new_happiness_level": new_happiness}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    
async def use_item(request: Request, db: AsyncIOMotorDatabase = Depends(get_db)):
    try:
        body = await request.json()
        pet_id_str = body.get("petId")
        user_id_str = body.get("userId")
        item_id_str = body.get("itemId")
        if not pet_id_str or not item_id_str:
            raise HTTPException(status_code=422, detail="petId and foodItem are required")
        
        try:
            pet_id = ObjectId(pet_id_str)
            item_id = ObjectId(item_id_str)
            
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid petId format")

        pet = await db.pets.find_one({"_id": pet_id})
        if pet is None:
            raise HTTPException(status_code=404, detail="Pet not found")
        
        item = await db.items.find_one({"_id": item_id})
        if item is None:
            raise HTTPException(status_code=404, detail="Food item not found")
                
        if user_id_str:
            try:
                user_id = ObjectId(user_id_str)
            except Exception:
                raise HTTPException(status_code=400, detail="Invalid userId format")
            
            inventory_entry = await db.inventory.find_one({
                "userId": user_id,
                "itemId": item_id
            })
            if not inventory_entry or inventory_entry.get("quantity", 0) <= 0:
                raise HTTPException(status_code=400, detail="Food item not in inventory")
            
            new_quantity = inventory_entry.get("quantity", 0) - 1
            if new_quantity > 0:
                await db.inventory.update_one(
                    {"_id": inventory_entry["_id"]},
                    {"$set": {"quantity": new_quantity}}
                )
            else:
                await db.inventory.delete_one({"_id": inventory_entry["_id"]})
        
        if item.get("itemType") == "FOOD":
            hunger_decrease = item.get("statsIncrease", 0)

            new_hunger = min(100, int(pet.get("energyLevel", 50)) + hunger_decrease)

            await db.pets.update_one(
                {"_id": pet_id},
                {"$set": {"energyLevel": new_hunger}}
            )

            return {
                "message": "Pet fed successfully",
                "new_energy_level": new_hunger
            }
        else:
            new_happiness = min(100, int(pet.get("happinessLevel", 0)) + item.get("statsIncrease", 0))

            await db.pets.update_one(
                {"_id": pet_id},
                {"$set": {"happinessLevel": new_happiness}}
            )

            return {
                "message": "Pet played with successfully",
                "new_happiness_level": new_happiness
            }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))  # Placeholder for future implementation
    
@router.post("/pets/feed")
async def feed_pet(request: Request, db: AsyncIOMotorDatabase = Depends(get_db)):
   return await use_item(request, db)
    
    
@router.post("/pets/play")
async def play_with_pet(request: Request, db: AsyncIOMotorDatabase = Depends(get_db)):
    return await use_item(request, db)
