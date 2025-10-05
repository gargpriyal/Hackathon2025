from dis import Instruction
from agents import Agent, Runner
from agent_tools import create_flashcard, vector_search, function_tool
from dotenv import load_dotenv
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException, Request
import requests
import os
import asyncio
load_dotenv()

from agents import Agent, Runner

base_url = os.getenv("API_BASE_URL")
pet_base_url = os.getenv("PET_SERVICE_URL")

agent = Agent(name="Tutor", 
              instructions=f"""
              You are a AI tutor, you can create flashcards when you see the student learn a new topic. 
              You can also search the vector database for relevant information to help the student.
              The flashcard contains the topic, question, choices, and the correct answer..
              
              Whenever you encounter something you cannot answer with your knowledge, refer to the vector database for relevant information.
              """,
              tools=[],
              model="gpt-4o"
              )

user_id = "68e21317867965c1f4ef9e40"
chat_id = "68e25118f49771b679a377f9"
space_id = "68e2131b867965c1f4ef9e45"

class Message(BaseModel):
    chat_id: str
    content: str
    space_id: str
    
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
    @function_tool
    def vector_search_tool(query: str, limit: int):
        """
        Searches the vector database for relevant information to help the student.
        
        args:
            query: str (the query to search the vector database)
            limit: int (the number of results to return)
        returns:
            results: list[dict] (the results of the search)
        """
        return vector_search(query, limit, message.space_id)
    
    @function_tool
    def create_flashcard_tool(topic_name: str, question: str, options: list[str], answer: int):
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
        return create_flashcard(topic_name, message.space_id, question, options, answer)
    
    
    agent.tools.append(vector_search_tool)
    agent.tools.append(create_flashcard_tool)
    
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
