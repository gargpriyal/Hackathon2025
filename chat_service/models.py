from enum import Enum
from typing import Any, Optional, List
from datetime import datetime, timezone
from pydantic import BaseModel, Field
from bson import ObjectId


class User(BaseModel):
    name: str
    email: str


class Space(BaseModel):
    user_id: str
    space_name: str


class Chat(BaseModel):
    space_id: str
    user_id: str  # ADD THIS - needed to track which user owns the chat
    title: str
    # REMOVE messages field - checkpointer handles this now
    # Or keep it for backward compatibility but don't use it
    metadata: dict = Field(default_factory=dict)  # For summaries, tags, topics discussed
    last_updated: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class LevelOfUnderstanding(str, Enum):
    Learning = "Learning"
    Basic = "Basic"
    Advanced = "Advanced"


class Topic(BaseModel):
    user_id: str
    name: str
    related_chats: List[str] = Field(default_factory=list)
    level_of_understanding: LevelOfUnderstanding


class Document(BaseModel):
    user_id: str
    name: str
    text_content: str
    embedding: List[float] = Field(default_factory=list)
    space_id: str
    chat_id: Optional[str] = None
    source: str = "upload"  # "upload", "generated", "conversation_summary"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_updated: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# OPTIONAL: Add this if you want denormalized message storage for easier querying
class Message(BaseModel):
    chat_id: str
    space_id: str
    user_id: str
    role: str  # "user", "assistant", "system"
    content: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    tool_calls: Optional[List[dict]] = None  # For tracking tool usage