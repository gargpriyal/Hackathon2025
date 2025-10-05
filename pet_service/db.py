from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from dotenv import load_dotenv
import os

load_dotenv()

# keep a reference to the client so we can close it later
_client: AsyncIOMotorClient | None = None

def get_connection() -> AsyncIOMotorDatabase:
    """Return a Motor AsyncIOMotorDatabase instance.

    Uses MONGODB_URI and optional MONGODB_DB (defaults to 'pet_service').
    """
    global _client
    try:
        uri = os.getenv("MONGODB_URI")
        if uri is None:
            raise ValueError("MONGODB_URI environment variable not set")

        _client = AsyncIOMotorClient(uri)
        print("MongoDB connection established")
        return _client["aivy_db"]
    except Exception as e:
        print(f"Error getting MongoDB connection: {e}")
        raise

async def close_connection(db: AsyncIOMotorDatabase):
    try:
        global _client
        if _client is not None:
            _client.close()
            print("MongoDB connection closed")
    except Exception as e:
        print(f"Error closing MongoDB connection: {e}")