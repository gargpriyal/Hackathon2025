from dis import Instruction
from agents import Agent, Runner
from agent_tools import create_flashcard
from dotenv import load_dotenv
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException, Request
import requests
import os
import asyncio
load_dotenv()

from agents import Agent, Runner

base_url = os.getenv("API_BASE_URL")

agent = Agent(name="Tutor", 
              instructions=f"You are a AI tutor, you can create flashcards when you see the student learn a new topic. The flashcard contains the topic, question, choices, and the correct answer..",
              tools=[create_flashcard],
              model="gpt-4o"
              )
user_id = "68e21317867965c1f4ef9e40"
chat_id = "68e22f7694872c7cd17b4b36"

class Message(BaseModel):
    chat_id: str
    content: str
    
app = FastAPI()

def assemble_conversation(result, new_input):
    if result !=None:
        new_input = result.to_input_list() + [{'content': new_input,
                                                'role': 'user'}]
    else:
        new_input = new_input
    return new_input

@app.post("/chat")
async def chat(message: Message):
    response = requests.get(
        f"{base_url}/chats/{message.chat_id}",
    )
    
    if response.status_code == 200:
        data = response.json()
        old_messages = data.get("messages")
        result = await Runner.run(agent, old_messages + [{'content': message.content, 'role': 'user'}])
        all_messages = result.to_input_list()
        new_messages = all_messages[len(old_messages):]
        update_resp = requests.put(
                f"{base_url}/bulk/messages/{message.chat_id}", 
                json=new_messages
        )
        if update_resp.json()["status"] == "success":
            return result.final_output
        else:
            return "Error: Failed to update chat messages"
    else:
        return "Error: Failed to get chat messages"
