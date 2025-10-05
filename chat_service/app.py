from typing import Any
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pymongo import AsyncMongoClient
from db import get_connection, close_connection
from models import User, Space, Chat, Topic, LevelOfUnderstanding, Document
from pydantic import BaseModel
from typing import Optional
from bson import ObjectId
import PyPDF2
from docx import Document as DocxDocument
import io
import voyageai
from datetime import datetime, timezone

class AddTopicToChat(BaseModel):
    user_id: str
    chat_id: str
    name: str

class UpdateTopicLevelOfUnderstanding(BaseModel):
    user_id: str
    name: str   
    level_of_understanding: LevelOfUnderstanding
    
class SearchDocuments(BaseModel):
    query: str
    space_id: str
    limit: int = 5

model = "voyage-3-large"
vo = voyageai.Client()

def get_embedding(data, input_type = "document"):
  embeddings = vo.embed(
      data, model = model, input_type = input_type
  ).embeddings
  return embeddings[0]

async def get_db():
    client = get_connection()
    db = client['aivy_db']
    try:
        yield db
    finally:
        await close_connection(client)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/health")
def check_health():
    """
    Checks if the server is running
    """
    return {"status": "ok"}

@app.get("/db_status")
async def check_db_status(db: AsyncMongoClient = Depends(get_db)):
    """
    Checks if the database is running
    """
    return {"status": "ok"}

@app.post("/users")
async def create_user(user: User, db: AsyncMongoClient = Depends(get_db)):
    """
    Add a new user to the database
    """
    collection = db['users']
    if await collection.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="User already exists")
    created_user = await collection.insert_one(user.model_dump())
    return {"status": "success", "user_id": str(created_user.inserted_id)}

@app.get("/users")
async def get_users(db: AsyncMongoClient = Depends(get_db)):
    """
    Get all users from the database
    """
    collection = db['users']
    users = await collection.find({}).to_list()
    for user in users:
        user["_id"] = str(user["_id"])
    return users

@app.get("/users/{user_id}")
async def get_user(user_id: str, db: AsyncMongoClient = Depends(get_db)):
    """
    Get a user from the database
    """
    collection = db['users']
    user = await collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user["_id"] = str(user["_id"])
    return user

@app.post("/spaces")
async def create_space(space: Space, db: AsyncMongoClient = Depends(get_db)):
    """
    Add a new space to the database
    """
    collection = db['spaces']
    user_collection = db['users']
    user = await user_collection.find_one({"_id": ObjectId(space.user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if await collection.find_one({"space_name": space.space_name}):
        raise HTTPException(status_code=400, detail="Spaces already exists")
    created_space = await collection.insert_one(space.model_dump())
    return {"status": "success", "space_id": str(created_space.inserted_id)}

@app.get("/spaces")
async def get_spaces(db: AsyncMongoClient = Depends(get_db)):
    """
    Get all spaces from the database
    """
    collection = db['spaces']
    spaces = await collection.find().to_list()
    for space in spaces:
        space["_id"] = str(space["_id"])
    return spaces

@app.get("/spaces/user/{user_id}")
async def get_spaces_user(user_id: str, db: AsyncMongoClient = Depends(get_db)):
    """
    Get all spaces of a user
    """
    collection = db['spaces']
    spaces = await collection.find({"user_id": ObjectId(user_id)}).to_list()
    for space in spaces:
        space["_id"] = str(space["_id"])
    return spaces

@app.get("/spaces/{space_id}")
async def get_space(space_id: str, db: AsyncMongoClient = Depends(get_db)):
    """
    Get a space from the database
    """
    collection = db['spaces']
    space = await collection.find_one({"_id": ObjectId(space_id)})
    if not space:
        raise HTTPException(status_code=404, detail="Spaces not found")
    space["_id"] = str(space["_id"])
    return space

@app.put("/spaces/{space_id}")
async def update_space(space_id: str, space_name: str, db: AsyncMongoClient = Depends(get_db)):
    """
    Update a space in the database
    """
    collection = db['spaces']
    updated_space = await collection.update_one({"_id": ObjectId(space_id)}, {"$set": {"space_name": space_name}})
    if updated_space.modified_count == 0:
        raise HTTPException(status_code=404, detail="Spaces not found")
    return {"status": "success", "space_id": str(space_id)}

@app.delete("/spaces/{space_id}")
async def delete_space(space_id: str, db: AsyncMongoClient = Depends(get_db)):
    """
    Delete a space from the database
    """
    collection = db['spaces']
    deleted_space = await collection.delete_one({"_id": ObjectId(space_id)})
    if deleted_space.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Spaces not found")
    return {"status": "success", "space_id": str(space_id)}

@app.post("/chats")
async def create_chat(chat: Chat, db: AsyncMongoClient = Depends(get_db)):
    """
    Add a new chat to the database
    """
    collection = db['chats']
    space_collection = db['spaces']
    space = await space_collection.find_one({"_id": ObjectId(chat.space_id)})
    if not space:
        raise HTTPException(status_code=404, detail="Spaces not found")
    created_chat = await collection.insert_one(chat.model_dump())
    return {"status": "success", "chat_id": str(created_chat.inserted_id)}

@app.put("/bulk/messages/{chat_id}")
async def bulk_update_messages(chat_id: str, bulk_update_messages: list[Any], db: AsyncMongoClient = Depends(get_db)):
    """
    Bulk update messages for a chat
    """
    collection = db['chats']
    chat = await collection.find_one({"_id": ObjectId(chat_id)})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    chat = Chat(**chat)
    for message in bulk_update_messages:
        chat.messages.append(message)
    await collection.update_one(
        {"_id": ObjectId(chat_id)},
        {"$set": {"messages": chat.messages, "last_updated": datetime.now(timezone.utc)}}
    )
    return {"status": "success", "added_count": len(bulk_update_messages)}

@app.get("/chats")
async def get_chats(db: AsyncMongoClient = Depends(get_db)):
    """
    Get all chats from the database
    """
    collection = db['chats']
    chats = await collection.find().to_list()
    for chat in chats:
        chat["_id"] = str(chat["_id"])
    return chats

@app.get("/chats/space/{space_id}")
async def get_chats_space(space_id: str, db: AsyncMongoClient = Depends(get_db)):
    """
    Get all chats in a space
    """
    collection = db['chats']
    chats = await collection.find({"space_id": ObjectId(space_id)}).to_list()
    for chat in chats:
        chat["_id"] = str(chat["_id"])
    return chats

@app.get("/chats/user/{user_id}")
async def get_chats_user(user_id: str, db: AsyncMongoClient = Depends(get_db)):
    """
    Get all chats of a user
    """
    collection = db['chats']
    chats = await collection.find({"user_id": ObjectId(user_id)}).to_list()
    for chat in chats:
        chat["_id"] = str(chat["_id"])
    return chats

@app.get("/chats/{chat_id}")
async def get_chat(chat_id: str, db: AsyncMongoClient = Depends(get_db)):
    """
    Get a chat from the database
    """
    collection = db['chats']
    chat = await collection.find_one({"_id": ObjectId(chat_id)})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    chat["_id"] = str(chat["_id"])

    return chat
    
@app.post("/add_topic_to_chat")
async def add_topic_to_chat(add_topic_to_chat: AddTopicToChat, db: AsyncMongoClient = Depends(get_db)):
    """
    Add a topic to a particular chat
    """
    collection = db['topics']
    if not await collection.find_one({"name": add_topic_to_chat.name}):
        new_topic = Topic(
            user_id=add_topic_to_chat.user_id,
            name=add_topic_to_chat.name,
            related_chats=[add_topic_to_chat.chat_id],
            level_of_understanding=LevelOfUnderstanding.Learning
        )
        await collection.insert_one(new_topic.model_dump())
        return {"status": "success", "topic_name": new_topic.name}
    else:
        updated_chat = await collection.update_one({"name": add_topic_to_chat.name}, {"$push": {"related_chats": add_topic_to_chat.chat_id}})
        if updated_chat.modified_count == 0:
            raise HTTPException(status_code=404, detail="Topic not found")
        return {"status": "success", "topic_name": add_topic_to_chat.name}

@app.put("/update_topic_level_of_understanding")
async def update_topic_level_of_understanding(update_topic_level_of_understanding: UpdateTopicLevelOfUnderstanding, db: AsyncMongoClient = Depends(get_db)):
    """
    Update the level of understanding for a topic of a user
    """
    collection = db['topics']
    updated_chat = await collection.update_one({"name": update_topic_level_of_understanding.name}, {"$set": {"level_of_understanding": update_topic_level_of_understanding.level_of_understanding}})
    if updated_chat.modified_count == 0:
        raise HTTPException(status_code=404, detail="Topic not found")
    return {"status": "success", "topic_name": update_topic_level_of_understanding.name}

@app.get("/topics")
async def get_topics(db: AsyncMongoClient = Depends(get_db)):
    """
    Get all topics from the database
    """
    collection = db['topics']
    topics = await collection.find().to_list()
    for topic in topics:
        topic["_id"] = str(topic["_id"])
    return topics

@app.get("/topics/{topic_name}")
async def get_topic(topic_name: str, db: AsyncMongoClient = Depends(get_db)):
    """
    Get a topic from the database
    """
    collection = db['topics']
    topic = await collection.find_one({"name": topic_name})
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    topic["_id"] = str(topic["_id"])
    return topic

@app.get("/topic_chats/{topic_name}")
async def get_chats_topic(topic_name: str, db: AsyncMongoClient = Depends(get_db)):
    """
    Get all chats of a topic
    """
    collection = db['topics']
    collection_chats = db['chats']
    topic = await collection.find_one({"name": topic_name})
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    topic = Topic(**topic)
    chats = []
    for chat_id in topic.related_chats:
        chat = await collection_chats.find_one({"_id": ObjectId(chat_id)})
        if chat:
            chat["_id"] = str(chat["_id"])
            chats.append(chat)
    return {"status": "success", "chats": chats}


@app.post("/documents")
async def parse_file(
    user_id: str = Form(...),
    space_id: str = Form(...),
    chat_id: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db = Depends(get_db),
):
    """
    Parse a file and add it to the database with a vector embedding
    """
    collection = db['documents']
    if not file:
        raise HTTPException(status_code=400, detail="File is required")
    file_content = await file.read()
    filename = file.filename.lower() if file.filename else ""
    
    if filename.endswith('.pdf'):
        # Parse PDF file
        pdf_file = io.BytesIO(file_content)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        text_content = ""
        for idx, page in enumerate(pdf_reader.pages):
            text_content += f"Page {idx + 1}\n"
            text_content += page.extract_text() + "\n"
        embedding = get_embedding(text_content)
        document = Document(
            user_id=user_id,
            space_id=space_id,
            name=filename,
            chat_id=chat_id,
            text_content=text_content.strip(),
            embedding=embedding
        )
        inserted_document = await collection.insert_one(document.model_dump())
        return {"status": "success", "document_id": str(inserted_document.inserted_id)}
        
    elif filename.endswith('.docx'):
        # Parse DOCX file
        docx_file = io.BytesIO(file_content)
        doc = DocxDocument(docx_file)
        text_content = ""
        for paragraph in doc.paragraphs:
            text_content += paragraph.text + "\n"
        embedding = get_embedding(text_content)
        document = Document(
            user_id=user_id,
            space_id=space_id,
            name=filename,
            chat_id=chat_id,
            text_content=text_content.strip(),
            embedding=embedding
        )
        inserted_document = await collection.insert_one(document.model_dump())
        return {"status": "success", "document_id": str(inserted_document.inserted_id)}
        
    elif filename.endswith(('.txt', '.md')):
        # Parse plain text files
        text_content = file_content.decode('utf-8')
        embedding = get_embedding(text_content)
        document = Document(
            user_id=user_id,
            space_id=space_id,
            name=filename,
            chat_id=chat_id,
            text_content=text_content.strip(),
            embedding=embedding
        )
        inserted_document = await collection.insert_one(document.model_dump())
        return {"status": "success", "document_id": str(inserted_document.inserted_id)}
        
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported file type. Supported formats: PDF, DOCX, TXT, MD")
            

@app.get("/documents/{document_id}")
async def get_document(document_id: str, db: AsyncMongoClient = Depends(get_db)):
    """
    Get a document from the database
    """
    collection = db['documents']
    document = await collection.find_one({"_id": ObjectId(document_id)})
    document["_id"] = str(document["_id"])
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document

@app.get("/documents")
async def get_documents(db: AsyncMongoClient = Depends(get_db)):
    """
    Get all documents from the database
    """
    collection = db['documents']
    documents = await collection.find().to_list()
    for document in documents:
        document["_id"] = str(document["_id"])
    return documents

@app.delete("/documents/{document_id}")
async def delete_document(document_id: str, db: AsyncMongoClient = Depends(get_db)):
    """
    Delete a document from the database
    """
    collection = db['documents']
    deleted_document = await collection.delete_one({"_id": ObjectId(document_id)})
    if deleted_document.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"status": "success", "document_id": str(document_id)}

@app.post("/search_documents/")
async def search_documents(search_documents: SearchDocuments, db: AsyncMongoClient = Depends(get_db)):
    """
    Vector Search for documents in the database
    """
    collection = db['documents']
    query_embedding = get_embedding(search_documents.query)
    
    print(search_documents)
    
    pipeline = [
        {
            "$vectorSearch": {
                    "index": "vector_index",
                    "queryVector": query_embedding,
                    "path": "embedding",
                    "exact": True,
                    "limit": search_documents.limit
            }
        }, 
        {
            "$match": {"space_id": search_documents.space_id}
        },
        {
            "$project": {
                "_id": 0, 
                "text_content": 1,
                "score": {
                    "$meta": "vectorSearchScore"
                }
            }
        },
    ]
    
    results = await collection.aggregate(pipeline)
    results = await results.to_list()
    return {"status": "success", "results": results}
    
    