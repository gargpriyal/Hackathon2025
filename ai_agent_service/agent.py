from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.prebuilt import create_react_agent
from mongodb_checkpointer import MongoDBCheckpointer
from agent_tools import (
    create_flashcard,
    update_user_knowledge,
    add_topic_to_chat,
    search_documents
)
from db import get_connection
import os
from dotenv import load_dotenv
import requests
import asyncio

load_dotenv()


# Initialize Gemini model
model = ChatGoogleGenerativeAI(
    model="gemini-1.5-pro",
    google_api_key=os.getenv("GOOGLE_API_KEY"),
    temperature=0.7,
    convert_system_message_to_human=True  # Gemini doesn't support system messages natively
)

# Tools available to the agent
tools = [
    create_flashcard,
    update_user_knowledge,
    add_topic_to_chat,
    search_documents
]

# Initialize MongoDB checkpointer
def get_checkpointer():
    """Get MongoDB checkpointer for persistent conversation history"""
    client = get_connection()
    return MongoDBCheckpointer(client, db_name="aivy_db")

def create_agent():
    """Create the ReACT agent with tools and checkpointer"""
    checkpointer = get_checkpointer()
    
    agent = create_react_agent(
        model=model,
        tools=tools,
        checkpointer=checkpointer
    )
    
    return agent

def get_system_prompt(user_topics: str, project_context: str = "") -> str:
    """Generate system prompt with user context"""
    return f"""You are an intelligent tutoring assistant that helps students learn effectively.

Your capabilities:
- Answer questions using available documents and your knowledge
- Create flashcards when students learn important concepts
- Track student progress and update their knowledge levels
- Identify and tag topics being discussed

Student's Current Knowledge:
{user_topics}

{project_context}

Guidelines:
1. When a student learns something important, create a flashcard to help them review it later
2. If you notice the student has improved their understanding of a topic, update their knowledge level
3. When the conversation shifts to a new topic, tag it appropriately
4. Always search documents first before answering questions about specific course material
5. Be encouraging and supportive in your teaching approach
6. Create flashcards that are clear, focused, and test understanding rather than memorization

Remember: Your goal is to help the student learn and retain information effectively."""


async def get_user_context(user_id: str, project_id: str) -> tuple[str, str]:
    """Retrieve user's topics and project context using requests"""
    
    # Get user's topics
    topics_response = await asyncio.to_thread(
        requests.get,
        f"http://localhost:8000/topics/user/{user_id}"
    )
    topics_data = topics_response.json() if topics_response.status_code == 200 else []
    
    topic_context = "\n".join([
        f"- {t['name']}: {t['level_of_understanding']}"
        for t in topics_data
    ]) if topics_data else "No topics learned yet"
    
    # Get project info
    project_response = await asyncio.to_thread(
        requests.get,
        f"http://localhost:8000/projects/{project_id}"
    )
    project_data = project_response.json() if project_response.status_code == 200 else {}
    project_name = project_data.get("project_name", "Unknown Project")
    
    project_context = f"Current Project: {project_name}"
    
    return topic_context, project_context