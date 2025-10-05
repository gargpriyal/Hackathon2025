from enum import Enum
from typing import Any, Optional, List, Annotated
from datetime import datetime, timezone
from pydantic import BaseModel, Field, GetCoreSchemaHandler
from pydantic_core import core_schema
from bson import ObjectId
from docx import Document as DocxDocument


class User(BaseModel):
    name: str
    email: str

class Space(BaseModel):
    user_id: str
    space_name: str


class Chat(BaseModel):
    space_id: str
    title: str
    messages: List[Any] = Field(default_factory=list)
    last_updated: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


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
    last_updated: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
