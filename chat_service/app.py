from typing import Any
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from pymongo import AsyncMongoClient
from db import get_connection, close_connection
from models import User, Project, Chat, Topic, LevelOfUnderstanding, Document
from pydantic import BaseModel
from typing import Optional
from bson import ObjectId
import PyPDF2
from docx import Document as DocxDocument
import io

class AddTopicToChat(BaseModel):
    user_id: str
    chat_id: str
    name: str

class UpdateTopicLevelOfUnderstanding(BaseModel):
    user_id: str
    name: str
    level_of_understanding: LevelOfUnderstanding

# class CreateDocumentForm(BaseModel):
#     user_id: str
#     project_id: str
#     chat_id: Optional[str] = None

async def get_db():
    client = get_connection()
    db = client['aivy_db']
    try:
        yield db
    finally:
        await close_connection(client)

app = FastAPI()

@app.get("/health")
def check_health():
    return {"status": "ok"}

@app.get("/db_status")
async def check_db_status(db: AsyncMongoClient = Depends(get_db)):
    return {"status": "ok"}

@app.post("/users")
async def create_user(user: User, db: AsyncMongoClient = Depends(get_db)):
    collection = db['users']
    if await collection.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="User already exists")
    created_user = await collection.insert_one(user.model_dump())
    return {"status": "success", "user_id": str(created_user.inserted_id)}

@app.get("/users")
async def get_users(db: AsyncMongoClient = Depends(get_db)):
    collection = db['users']
    users = await collection.find({}).to_list()
    for user in users:
        user["_id"] = str(user["_id"])
    return users

@app.get("/users/{user_id}")
async def get_user(user_id: str, db: AsyncMongoClient = Depends(get_db)):
    collection = db['users']
    user = await collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user["_id"] = str(user["_id"])
    return user

@app.post("/projects")
async def create_project(project: Project, db: AsyncMongoClient = Depends(get_db)):
    collection = db['projects']
    user_collection = db['users']
    user = await user_collection.find_one({"_id": ObjectId(project.user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if await collection.find_one({"project_name": project.project_name}):
        raise HTTPException(status_code=400, detail="Project already exists")
    created_project = await collection.insert_one(project.model_dump())
    return {"status": "success", "project_id": str(created_project.inserted_id)}

@app.get("/projects")
async def get_projects(db: AsyncMongoClient = Depends(get_db)):
    collection = db['projects']
    projects = await collection.find().to_list()
    for project in projects:
        project["_id"] = str(project["_id"])
    return projects

@app.get("/projects/{project_id}")
async def get_project(project_id: str, db: AsyncMongoClient = Depends(get_db)):
    collection = db['projects']
    project = await collection.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    project["_id"] = str(project["_id"])
    return project

@app.put("/projects/{project_id}")
async def update_project(project_id: str, project_name: str, db: AsyncMongoClient = Depends(get_db)):
    collection = db['projects']
    updated_project = await collection.update_one({"_id": ObjectId(project_id)}, {"$set": {"project_name": project_name}})
    if updated_project.modified_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"status": "success", "project_id": str(project_id)}

@app.delete("/projects/{project_id}")
async def delete_project(project_id: str, db: AsyncMongoClient = Depends(get_db)):
    collection = db['projects']
    deleted_project = await collection.delete_one({"_id": ObjectId(project_id)})
    if deleted_project.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"status": "success", "project_id": str(project_id)}

@app.post("/chats")
async def create_chat(chat: Chat, db: AsyncMongoClient = Depends(get_db)):
    collection = db['chats']
    project_collection = db['projects']
    project = await project_collection.find_one({"_id": ObjectId(chat.project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    created_chat = await collection.insert_one(chat.model_dump())
    return {"status": "success", "chat_id": str(created_chat.inserted_id)}

@app.put("/bulk/messages/{chat_id}")
async def bulk_update_messages(chat_id: str, bulk_update_messages: list[Any], db: AsyncMongoClient = Depends(get_db)):
    collection = db['chats']
    chat = await collection.find_one({"_id": ObjectId(chat_id)})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    chat = Chat(**chat)
    for message in bulk_update_messages:
        chat.messages.append(message)
    await collection.update_one({"_id": ObjectId(chat_id)}, {"$set": {"messages": chat.messages}})
    return {"status": "success", "added_count": len(bulk_update_messages)}

@app.get("/chats")
async def get_chats(db: AsyncMongoClient = Depends(get_db)):
    collection = db['chats']
    chats = await collection.find().to_list()
    for chat in chats:
        chat["_id"] = str(chat["_id"])
    return chats

@app.get("/chats/project/{project_id}")
async def get_chats_project(project_id: str, db: AsyncMongoClient = Depends(get_db)):
    collection = db['chats']
    chats = await collection.find({"project_id": ObjectId(project_id)}).to_list()
    for chat in chats:
        chat["_id"] = str(chat["_id"])
    return chats

@app.get("/chats/user/{user_id}")
async def get_chats_user(user_id: str, db: AsyncMongoClient = Depends(get_db)):
    collection = db['chats']
    chats = await collection.find({"user_id": ObjectId(user_id)}).to_list()
    for chat in chats:
        chat["_id"] = str(chat["_id"])
    return chats

@app.get("/chats/{chat_id}")
async def get_chat(chat_id: str, db: AsyncMongoClient = Depends(get_db)):
    collection = db['chats']
    chat = await collection.find_one({"_id": ObjectId(chat_id)})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    return chat
    
@app.post("/add_topic_to_chat")
async def add_topic_to_chat(add_topic_to_chat: AddTopicToChat, db: AsyncMongoClient = Depends(get_db)):
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
    collection = db['topics']
    updated_chat = await collection.update_one({"name": update_topic_level_of_understanding.name}, {"$set": {"level_of_understanding": update_topic_level_of_understanding.level_of_understanding}})
    if updated_chat.modified_count == 0:
        raise HTTPException(status_code=404, detail="Topic not found")
    return {"status": "success", "topic_name": update_topic_level_of_understanding.name}

@app.get("/topics")
async def get_topics(db: AsyncMongoClient = Depends(get_db)):
    collection = db['topics']
    topics = await collection.find().to_list()
    for topic in topics:
        topic["_id"] = str(topic["_id"])
    return topics

@app.get("/topics/{topic_name}")
async def get_topic(topic_name: str, db: AsyncMongoClient = Depends(get_db)):
    collection = db['topics']
    topic = await collection.find_one({"name": topic_name})
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    topic["_id"] = str(topic["_id"])
    return topic

@app.get("/chats/{topic_name}")
async def get_chats_topic(topic_name: str, db: AsyncMongoClient = Depends(get_db)):
    collection = db['topics']
    collection_chats = db['chats']
    topic = await collection.find_one({"name": topic_name})
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    topic = Topic(**topic)
    chats = await collection_chats.find({"_id": {"$in": topic.related_chats}}).to_list()
    for chat in chats:
        chat["_id"] = str(chat["_id"])
    return chats

@app.post("/documents")
async def parse_file(
    user_id: str = Form(...),
    project_id: str = Form(...),
    chat_id: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db = Depends(get_db),
):
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
        
        document = Document(
            user_id=user_id,
            project_id=project_id,
            name=filename,
            chat_id=chat_id,
            text_content=text_content.strip(),
            embedding=[]
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
        document = Document(
            user_id=user_id,
            project_id=project_id,
            name=filename,
            chat_id=chat_id,
            text_content=text_content.strip(),
            embedding=[]
        )
        inserted_document = await collection.insert_one(document.model_dump())
        return {"status": "success", "document_id": str(inserted_document.inserted_id)}
        
    elif filename.endswith(('.txt', '.md')):
        # Parse plain text files
        text_content = file_content.decode('utf-8')
        document = Document(
            user_id=user_id,
            project_id=project_id,
            name=filename,
            chat_id=chat_id,
            text_content=text_content.strip(),
            embedding=[]
        )
        inserted_document = await collection.insert_one(document.model_dump())
        return {"status": "success", "document_id": str(inserted_document.inserted_id)}
        
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported file type. Supported formats: PDF, DOCX, TXT, MD")
            

@app.get("/documents/{document_id}")
async def get_document(document_id: str, db: AsyncMongoClient = Depends(get_db)):
    collection = db['documents']
    document = await collection.find_one({"_id": ObjectId(document_id)})
    document["_id"] = str(document["_id"])
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document

@app.get("/documents")
async def get_documents(db: AsyncMongoClient = Depends(get_db)):
    collection = db['documents']
    documents = await collection.find().to_list()
    for document in documents:
        document["_id"] = str(document["_id"])
    return documents

@app.delete("/documents/{document_id}")
async def delete_document(document_id: str, db: AsyncMongoClient = Depends(get_db)):
    collection = db['documents']
    deleted_document = await collection.delete_one({"_id": ObjectId(document_id)})
    if deleted_document.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"status": "success", "document_id": str(document_id)}
