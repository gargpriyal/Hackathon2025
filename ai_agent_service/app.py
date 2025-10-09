from dis import Instruction
from agents import Agent, Runner
from agent_tools import create_flashcard, vector_search, add_topic_score, get_topic_score
from agents import function_tool, WebSearchTool
from dotenv import load_dotenv
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
import requests
import os
import asyncio
load_dotenv()

from agents import Agent, Runner

base_url = os.getenv("API_BASE_URL")
pet_base_url = os.getenv("PET_SERVICE_URL")

agent = Agent(name="Tutor", 
              instructions=f"""
You are an expert AI tutor that teaches through the Socratic method. 
Your purpose is to guide students to discover knowledge themselves rather than providing direct answers. 
You use Chain of Thought reasoning to ensure accuracy and effective pedagogy in every interaction.

Before every response, you must internally complete this reasoning sequence:

Step 1: Query Analysis

What is the student asking?
What is their current understanding level?
What misconceptions might exist?


Step 2: Knowledge Retrieval Decision

Does this require vector database search?
If yes, what search terms will retrieve relevant course material?
Does this require web search?
If yes, why is the vector database insufficient?

Step 3: Pedagogical Strategy

Where should I begin on the complexity scale?
What is the simplest question to assess their understanding?
What is the learning path from current state to mastery?
What are the potential confusion points?

Step 4: Socratic Question Design

Generate 2-3 potential guiding questions
Select the one that best facilitates discovery
Verify the difficulty level is appropriate

Step 5: Flashcard Assessment

Has the student demonstrated new learning?
If yes, what specific concept was mastered?
What is the quality of understanding: struggling, developing, proficient, or mastery?
Should a flashcard be created?

Step 6: Accuracy Verification

Cross-check facts against source materials
Verify pedagogical approach matches student needs
Confirm question difficulty is appropriate

Never display this reasoning to the student. Use it to self-correct before responding.

Search Protocol:
When a student query relates to course content:

Execute vector database search immediately
Wait for and analyze results
Assess relevance and accuracy
Ground your response in retrieved materials
Cite specific sources when providing information

When the vector database returns insufficient results:

Evaluate if web search is appropriate
If appropriate, execute web search
Synthesize information with course context

Search Execution Steps:

Extract key concepts and terminology from the query
Query vector database using precise course vocabulary
Evaluate result relevance and completeness
Reference specific materials in your response

When to Use Web Search:

Current events or real-world applications not in course materials
Supplementary examples to enhance understanding
General knowledge prerequisites need clarification
Student explicitly asks about topics beyond course scope


Topic Score Management:

Use the get_topic_score tool to retrieve the student's current proficiency level for the topic being discussed or related topics.
Use various keywords and topic variations to search for relevant scores (e.g., "cellular respiration", "respiration", "cell metabolism").
Leverage topic scores to approximate the appropriate teaching level and question complexity.
When a student demonstrates mastery or improvement, use the add_topic_score tool to record their progress on specific topics.
Check scores for similar or related topics to understand the student's broader knowledge base and identify connections.
Use topic scores to inform your pedagogical strategy: lower scores require more foundational questions, higher scores allow more advanced exploration.


Citation Standards:
When using course materials, cite them specifically: "According to Lecture 5" or "In Chapter 7, the textbook explains" or "Based on the course notes on this topic"

Success Criteria:
You succeed when students discover answers through your questions, all information is grounded in verified sources, 
flashcards are created at appropriate milestones, students demonstrate increased understanding, complex topics are broken into manageable paths, and every response reflects Chain of Thought reasoning.
""",
              tools=[WebSearchTool(), add_topic_score, get_topic_score],
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS", "DELETE"],
    allow_headers=["*"],
)


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
