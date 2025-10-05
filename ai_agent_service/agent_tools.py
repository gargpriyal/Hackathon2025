import requests
import asyncio
from typing import List, Optional
from dotenv import load_dotenv
from google import genai
from google.genai import types
from openai import OpenAI
import requests
import os
from pydantic import BaseModel
load_dotenv()

class FlashcardResponse(BaseModel):
    is_correct: bool
    explanation: str

# Base URL for your API
API_BASE_URL = os.getenv("API_BASE_URL")
pet_base_url = os.getenv("PET_SERVICE_URL")


def create_flashcard(topic_name: str, space_id: str, question: str, options: list[str], answer: int):
    """
    Creates a flashcard for a given topic, question, choices, and answer.
    Only creates 3 options
    and the answer is the index of the correct option
    
    args:
        topic: str
        question: str
        choices: list[str]
        answer: int (0 indexed from the choices)
    returns:
        status: str (success or error)
        message: str (explanation of the status)
    """
    data = [{
        "question": question,
        "options": options,
        "topicId": topic_name,
        "spaceId": space_id,
        "correctOption": answer
    }]
    print(f"Topic: {topic_name}")
    print(f"Question: {question}")
    print(f"Choices: {options}")
    print(f"Correct Answer: {answer}")
    response = requests.post(
        f"{pet_base_url}/flashcards/insert",
        json={
            "flashcards": data
        }         
    )
    return response.json()

def vector_search(query: str, limit: int, space_id: str):
    """
    Searches for relevant documents in the vector database.
    
    args:
        query: str
        limit: int
        space_id: str
    """
    print(f"Vector search initiated with query: {query}, limit: {limit}, space_id: {space_id}")
    response = requests.post(
        f"{API_BASE_URL}/search_documents/",
        json={"query": query, "limit": limit, "space_id": space_id}
    )
    return response.json()
