from fastapi import APIRouter, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from deps import get_db

router = APIRouter()


@router.get("/pets/{pet_id}")
async def get_pet(pet_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    try:
        pet = await db.pets.find_one({"_id": pet_id})
        if pet is None:
            raise HTTPException(status_code=404, detail="Pet not found")
        return pet
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/pets/create")
async def create_pet(pet: dict, db: AsyncIOMotorDatabase = Depends(get_db)):
    try:
        result = await db.pets.insert_one(pet)
        return {"inserted_id": str(result.inserted_id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



