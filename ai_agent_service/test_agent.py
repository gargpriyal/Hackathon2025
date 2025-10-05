import requests
import json
import time

def test_chat():
    """Test the chat agent endpoint using requests"""
    
    base_url = "http://localhost:8001"
    
    # Create user
    print("Creating user...")
    user_resp = requests.post(
        f"{base_url}/users",
        json={"name": "Test Student", "email": "test@example.com"}
    )
    user_data = user_resp.json()
    user_id = user_data.get("user_id")
    print(f"Created user: {user_id}")
    
    # Create project
    print("Creating project...")
    project_resp = requests.post(
        f"{base_url}/projects",
        json={"user_id": user_id, "project_name": "Database Course"}
    )
    project_data = project_resp.json()
    project_id = project_data.get("project_id")
    print(f"Created project: {project_id}")
    
    # Create chat
    print("Creating chat...")
    chat_resp = requests.post(
        f"{base_url}/chats",
        json={
            "user_id": user_id,
            "project_id": project_id,
            "title": "Learning Session 1"
        }
    )
    chat_data = chat_resp.json()
    chat_id = chat_data.get("chat_id")
    print(f"Created chat: {chat_id}")
    
    # Test chat with agent
    print("\n" + "="*60)
    print("Testing Agent Chat")
    print("="*60)
    
    messages = [
        "Hi! Can you help me learn about database indexing?",
        "What are B-trees and why are they important?",
        "Can you create a flashcard to help me remember this?"
    ]
    
    for msg in messages:
        print(f"\nUser: {msg}")
        
        response = requests.post(
            f"{base_url}/chat",
            json={
                "user_id": user_id,
                "project_id": project_id,
                "chat_id": chat_id,
                "message": msg
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"Assistant: {data['response']}")
        else:
            print(f"Error: {response.text}")
        
        # Small delay between messages
        time.sleep(2)

if __name__ == "__main__":
    test_chat()