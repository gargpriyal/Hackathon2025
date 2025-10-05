from fastapi import APIRouter, HTTPException, Request, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, ValidationError
from deps import get_db
from bson import ObjectId

router = APIRouter()


@router.post("/inventory/purchase")
async def purchase_item(request: Request, db: AsyncIOMotorDatabase = Depends(get_db)):
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

        user_coins = int(user.get("coins", 0))
        item_price = int(item.get("price", 0))
        total_cost = item_price * quantity

        if user_coins < total_cost:
            raise HTTPException(status_code=400, detail="Insufficient coins")

        new_coins = user_coins - total_cost
        await db.users.update_one({"_id": userId}, {"$set": {"coins": new_coins}})

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


@router.get("/inventory")
async def get_inventory(request: Request, db: AsyncIOMotorDatabase = Depends(get_db)):
    try:
        userId = request.query_params.get("userId")
        if userId is None:
            raise HTTPException(status_code=422, detail="Missing userId query parameter")
        
        userId = ObjectId(userId)
        inventory_cursor = db.inventory.find({"userId": userId})
        inventory = []
        async for entry in inventory_cursor:
            inv_id = entry.get("_id")
            if inv_id is not None:
                try:
                    inv_id = str(inv_id)
                except Exception:
                    pass

            entry_item_id = entry.get("itemId")
            item = None
            try:
                if isinstance(entry_item_id, ObjectId):
                    item = await db.items.find_one({"_id": entry_item_id})
            except Exception:
                item = None

            # convert any ObjectId values inside the item dict to strings
            if item is not None:
                for k, v in list(item.items()):
                    try:
                        if isinstance(v, ObjectId):
                            item[k] = str(v)
                    except Exception:
                        pass

            # include the inventory entry even if the item document wasn't found
            inventory.append({
                "inventoryId": inv_id,
                "item": item,
                "quantity": int(entry.get("quantity", 0)),
            })

        # return userId as string for JSON safety
        try:
            user_id_str = str(userId)
        except Exception:
            user_id_str = userId

        return {"userId": user_id_str, "inventory": inventory}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
