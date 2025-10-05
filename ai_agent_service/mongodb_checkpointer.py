from typing import Any, Dict, Optional, Sequence
from langgraph.checkpoint.base import BaseCheckpointSaver, Checkpoint
from pymongo import AsyncMongoClient
from datetime import datetime
import pickle

class MongoDBCheckpointer(BaseCheckpointSaver):
    """Custom MongoDB checkpoint saver for LangGraph"""
    
    def __init__(self, client: AsyncMongoClient, db_name: str = "aivy_db"):
        self.client = client
        self.db = client[db_name]
        self.collection = self.db["checkpoints"]
    
    async def aget(self, config: Dict[str, Any]) -> Optional[Checkpoint]:
        """Get checkpoint from MongoDB"""
        thread_id = config["configurable"]["thread_id"]
        
        doc = await self.collection.find_one(
            {"thread_id": thread_id},
            sort=[("checkpoint_id", -1)]
        )
        
        if not doc:
            return None
        
        return pickle.loads(doc["checkpoint_data"])
    
    async def aput(
        self,
        config: Dict[str, Any],
        checkpoint: Checkpoint,
        metadata: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Save checkpoint to MongoDB"""
        thread_id = config["configurable"]["thread_id"]
        
        doc = {
            "thread_id": thread_id,
            "checkpoint_id": checkpoint["id"],
            "checkpoint_data": pickle.dumps(checkpoint),
            "metadata": {
                **metadata,
                "user_id": config["configurable"].get("user_id"),
                "project_id": config["configurable"].get("project_id")
            },
            "created_at": datetime.utcnow()
        }
        
        await self.collection.insert_one(doc)
        
        return {"configurable": {"thread_id": thread_id}}
    
    async def alist(
        self,
        config: Dict[str, Any],
        *,
        filter: Optional[Dict[str, Any]] = None,
        before: Optional[Dict[str, Any]] = None,
        limit: Optional[int] = None
    ) -> Sequence[Checkpoint]:
        """List checkpoints"""
        thread_id = config["configurable"]["thread_id"]
        
        query = {"thread_id": thread_id}
        if filter:
            query.update(filter)
        
        cursor = self.collection.find(query).sort("checkpoint_id", -1)
        
        if limit:
            cursor = cursor.limit(limit)
        
        docs = await cursor.to_list(length=limit)
        
        return [pickle.loads(doc["checkpoint_data"]) for doc in docs]

    def get(self, config: Dict[str, Any]) -> Optional[Checkpoint]:
        """Sync version - not implemented"""
        raise NotImplementedError("Use aget instead")
    
    def put(
        self,
        config: Dict[str, Any],
        checkpoint: Checkpoint,
        metadata: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Sync version - not implemented"""
        raise NotImplementedError("Use aput instead")
    
    def list(
        self,
        config: Dict[str, Any],
        *,
        filter: Optional[Dict[str, Any]] = None,
        before: Optional[Dict[str, Any]] = None,
        limit: Optional[int] = None
    ) -> Sequence[Checkpoint]:
        """Sync version - not implemented"""
        raise NotImplementedError("Use alist instead")