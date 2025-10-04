from pymongo import AsyncMongoClient
from dotenv import load_dotenv
import os

load_dotenv()

def get_connection() -> AsyncMongoClient:
    try:
        uri = os.getenv("MONGODB_URI")
        if uri is None:
            raise ValueError("MONGODB_URI environment variable not set")
        
        client = AsyncMongoClient(uri)
        print("MongoDB connection established")
        return client
    except Exception as e:
        print(f"Error getting MongoDB connection: {e}")
        raise

async def close_connection(client: AsyncMongoClient):
    try:
        await client.close()
        print("MongoDB connection closed")
    except Exception as e:
        print(f"Error closing MongoDB connection: {e}")
    raise