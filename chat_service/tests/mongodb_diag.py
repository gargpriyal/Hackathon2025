# test_connection.py
import asyncio
from pymongo import AsyncMongoClient
from dotenv import load_dotenv
import os

load_dotenv()

async def test_connection():
    uri = os.getenv("MONGODB_URI")
    print(f"Testing connection to: {uri[:20]}...") # Print partial URI
    
    try:
        client = AsyncMongoClient(uri, serverSelectionTimeoutMS=5000)
        # Test the connection
        await client.admin.command('ping')
        print("✅ Successfully connected to MongoDB!")
        
        # List databases
        dbs = await client.list_database_names()
        print(f"Available databases: {dbs}")
        
        await client.close()
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        print("\nTroubleshooting steps:")
        print("1. Check IP whitelist in MongoDB Atlas")
        print("2. Verify credentials in connection string")
        print("3. Check if you're behind a firewall/VPN")

if __name__ == "__main__":
    asyncio.run(test_connection())