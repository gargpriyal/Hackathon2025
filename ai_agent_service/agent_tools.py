import requests
import asyncio
from typing import List, Optional
from dotenv import load_dotenv
from google import genai
from google.genai import types
from openai import OpenAI
from agents import function_tool
import requests
import os
from pydantic import BaseModel
load_dotenv()

class FlashcardResponse(BaseModel):
    is_correct: bool
    explanation: str

# Base URL for your API
API_BASE_URL = os.getenv("API_BASE_URL")

@function_tool
def create_flashcard(topic: str, question: str, choices: list[str], answer: int):
    """
    Creates a flashcard for a given topic, question, choices, and answer.
    
    args:
        topic: str
        question: str
        choices: list[str]
        answer: int (0 indexed from the choices)
    returns:
        status: str (success or error)
        message: str (explanation of the status)
    """
    print(f"Topic: {topic}")
    print(f"Question: {question}")
    print(f"Choices: {choices}")
    print(f"Correct Answer: {answer}")
    return {"status": "success", "message": "Flashcard created successfully"}
