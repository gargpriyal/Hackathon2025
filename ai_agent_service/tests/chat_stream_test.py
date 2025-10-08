import asyncio
import httpx
import json

async def test_chat_stream(user_request: list[str]):
    url = "http://localhost:8000/chat-stream"
    params = {"query": user_request}
    i = 0
    async with httpx.AsyncClient(timeout=None) as client:
        async with client.stream("GET", url, params=params) as response:
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    data = json.loads(line[6:])
                    if data['type'] == 'delta_event':
                        print(data['data'], end="")
                    elif data['type'] == 'agent_updated_event':
                        print(f"Agent updated: {data['data']}")
                    elif data['type'] == 'tool_call_event':
                        print(f"Tool called: {data['data']['name']}")
                    elif data['type'] == 'tool_call_output_event':
                        print(f"Tool output: {data['data']['output']}")
                    elif data['type'] == 'final_data':
                        print(f"Final data: {data['data']}")

if __name__ == "__main__":
    input_request = input("Enter a request: ")
    messages = [{"role": "user", "content": input_request}]
    asyncio.run(test_chat_stream(messages))
        