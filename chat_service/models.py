from enum import Enum
from typing import Any, Optional, List, Annotated
from pydantic import BaseModel, Field, GetCoreSchemaHandler
from pydantic_core import core_schema
from bson import ObjectId
from docx import Document as DocxDocument


class _ObjectIdPydanticAnnotation:
    @classmethod
    def __get_pydantic_core_schema__(
        cls,
        _source_type: Any,
        _handler: GetCoreSchemaHandler,
    ) -> core_schema.CoreSchema:
        def validate_from_str(value: str) -> ObjectId:
            if ObjectId.is_valid(value):
                return ObjectId(value)
            raise ValueError("Invalid ObjectId")
        
        from_str_schema = core_schema.chain_schema(
            [
                core_schema.str_schema(),
                core_schema.no_info_plain_validator_function(validate_from_str),
            ]
        )
        
        return core_schema.json_or_python_schema(
            json_schema=from_str_schema,
            python_schema=core_schema.union_schema(
                [
                    core_schema.is_instance_schema(ObjectId),
                    from_str_schema,
                ]
            ),
            serialization=core_schema.plain_serializer_function_ser_schema(
                lambda x: str(x)
            ),
        )


PyObjectId = Annotated[ObjectId, _ObjectIdPydanticAnnotation]



class User(BaseModel):
    name: str
    email: str

class Project(BaseModel):
    user_id: str
    project_name: str


class Chat(BaseModel):
    project_id: str
    title: str
    messages: List[Any] = Field(default_factory=list)


class LevelOfUnderstanding(str, Enum):
    Learning = "Learning"
    Basic = "Basic"
    Advanced = "Advanced"


class Topic(BaseModel):
    user_id: str
    name: str
    related_chats: List[PyObjectId] = Field(default_factory=list)
    level_of_understanding: LevelOfUnderstanding


class Document(BaseModel):
    user_id: str
    name: str
    text_content: str
    embedding: List[float] = Field(default_factory=list)
    project_id: str
    chat_id: Optional[str] = None
