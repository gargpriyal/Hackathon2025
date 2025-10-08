from agents import Agent, Runner, function_tool
import asyncio
import math
from dotenv import load_dotenv
from openai.types.responses import ResponseTextDeltaEvent
from fastapi import FastAPI, Response
from fastapi.responses import StreamingResponse
import json
load_dotenv()

app = FastAPI()

@function_tool
def sine(x: int) -> float:
    """
    args:
        x: angle in radians
    returns:
        sine of x
    """
    return math.sin(x)


@function_tool
def cosine(x: int) -> float:
    """
    args:
        x: angle in radians
    returns:
        cosine of x
    """
    return math.cos(x)


agent = Agent(name="Math Agent", tools=[sine, cosine], instructions="You are a math agent that can solve math problems.", model="gpt-4o-mini")


async def chat_stream(query: list[str]):
    streamed = Runner.run_streamed(agent, query)
    async for event in streamed.stream_events():
        if event.type == "raw_response_event" and isinstance(event.data, ResponseTextDeltaEvent):
            yield f"data: {json.dumps({'type':'delta_event','data':event.data.delta})}\n\n"
        elif event.type == "agent_updated_stream_event":
            yield f"data: {json.dumps({'type':'agent_updated_event','data':event.new_agent.name})}\n\n"
        elif event.type == "run_item_stream_event":
            if event.item.type == "tool_call_item":
                payload = {'type':'tool_call_event','data':{'name':event.item.raw_item.name,'arguments':event.item.raw_item.arguments}}
                yield f"data: {json.dumps(payload)}\n\n"
    
    final_data = streamed.to_input_list()
    yield f"data: {json.dumps({'type':'final_data','data':final_data})}\n\n"

@app.get("/chat-stream")
async def chat_stream_endpoint(query: str):
    return StreamingResponse(
        chat_stream(query),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )