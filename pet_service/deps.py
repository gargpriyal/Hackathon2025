from typing import AsyncGenerator
from motor.motor_asyncio import AsyncIOMotorDatabase
from db import get_connection, close_connection

async def get_db() -> AsyncGenerator[AsyncIOMotorDatabase, None]:
    db = get_connection()
    try:
        yield db
    finally:
        await close_connection(db)
