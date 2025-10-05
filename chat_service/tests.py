"""
Chat Service API Test Suite (requests-based)

Updated for LangGraph checkpointer integration:
- Chats now require user_id
- Messages stored in checkpointer (not in Chat document)
- New endpoints: /chats/{chat_id}/messages, /chats/{chat_id}/metadata
- Topic queries now require user_id
- Base URL is configurable via BASE_URL.
- Covers: /health, /db_status, /users, /projects, /chats, topics endpoints
- Skips all /documents endpoints as requested.
- Idempotent: handles "already exists" responses gracefully.
- Uses the given bad-id for 404 checks: 68e1cb9ba053056bda7138c3
"""

import requests
from typing import Dict, Any, Optional

# ========================
# Config
# ========================
BASE_URL = "http://localhost:8000"
BAD_ID = "68e1cb9ba053056bda7138c3"  # provided for 404 tests

# ========================
# Pretty printing
# ========================
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    BOLD = '\033[1m'
    RESET = '\033[0m'

def ok(msg: str):
    print(f"{Colors.GREEN}✔ {msg}{Colors.RESET}")

def fail(msg: str):
    print(f"{Colors.RED}✘ {msg}{Colors.RESET}")

def info(msg: str):
    print(f"{Colors.CYAN}… {msg}{Colors.RESET}")

def warn(msg: str):
    print(f"{Colors.YELLOW}⚠ {msg}{Colors.RESET}")

# ========================
# Helpers
# ========================
def expect_json(resp: requests.Response) -> Optional[Dict[str, Any]]:
    try:
        return resp.json()
    except Exception:
        return None

def find_user_id_by_email(email: str) -> Optional[str]:
    r = requests.get(f"{BASE_URL}/users")
    if r.status_code != 200:
        return None
    data = expect_json(r) or []
    for u in data:
        if u.get("email") == email:
            return u.get("_id")
    return None

def find_project_id_by_name(user_id: str, project_name: str) -> Optional[str]:
    r = requests.get(f"{BASE_URL}/projects")
    if r.status_code != 200:
        return None
    data = expect_json(r) or []
    for p in data:
        if p.get("project_name") == project_name and p.get("user_id") == user_id:
            return p.get("_id")
    return None

def find_chat_id_by_title(project_id: str, title: str) -> Optional[str]:
    r = requests.get(f"{BASE_URL}/chats/project/{project_id}")
    if r.status_code != 200:
        return None
    data = expect_json(r) or []
    for c in data:
        if c.get("title") == title:
            return c.get("_id")
    return None

# ========================
# Test Runner
# ========================
def main():
    session = requests.Session()
    passed = 0
    failed = 0

    # -----------------------------------
    # Health
    # -----------------------------------
    info("Testing /health")
    r = session.get(f"{BASE_URL}/health")
    if r.status_code == 200 and (expect_json(r) or {}).get("status") == "ok":
        ok("GET /health")
        passed += 1
    else:
        fail(f"GET /health -> {r.status_code}, body={r.text}")
        failed += 1

    info("Testing /db_status")
    r = session.get(f"{BASE_URL}/db_status")
    if r.status_code == 200 and (expect_json(r) or {}).get("status") == "ok":
        ok("GET /db_status")
        passed += 1
    else:
        fail(f"GET /db_status -> {r.status_code}, body={r.text}")
        failed += 1

    # -----------------------------------
    # Users
    # -----------------------------------
    test_user_email = "jane.testsuite@example.com"
    test_user_body = {"name": "Jane Doe", "email": test_user_email}
    info("Creating user (or resolving existing)")
    r = session.post(f"{BASE_URL}/users", json=test_user_body)
    if r.status_code == 200:
        user_id = (expect_json(r) or {}).get("user_id")
        if user_id:
            ok("POST /users (created)")
            passed += 1
        else:
            fail(f"POST /users (created) but no user_id in response: {r.text}")
            failed += 1
    elif r.status_code == 400 and (expect_json(r) or {}).get("detail") == "User already exists":
        user_id = find_user_id_by_email(test_user_email)
        if user_id:
            ok("POST /users -> already exists, resolved user_id")
            passed += 1
        else:
            fail("POST /users -> already exists, but could not resolve user_id from /users")
            failed += 1
    else:
        fail(f"POST /users -> {r.status_code}, body={r.text}")
        failed += 1
        user_id = None

    info("GET /users")
    r = session.get(f"{BASE_URL}/users")
    if r.status_code == 200 and isinstance(expect_json(r), list):
        ok("GET /users")
        passed += 1
    else:
        fail(f"GET /users -> {r.status_code}, body={r.text}")
        failed += 1

    info("GET /users/{user_id}")
    if user_id:
        r = session.get(f"{BASE_URL}/users/{user_id}")
        if r.status_code == 200 and (expect_json(r) or {}).get("_id") == user_id:
            ok("GET /users/{user_id}")
            passed += 1
        else:
            fail(f"GET /users/{{user_id}} -> {r.status_code}, body={r.text}")
            failed += 1

    info("GET /users/{BAD_ID} expecting 404")
    r = session.get(f"{BASE_URL}/users/{BAD_ID}")
    if r.status_code == 404:
        ok("GET /users/{BAD_ID} -> 404 as expected")
        passed += 1
    else:
        fail(f"GET /users/{{BAD_ID}} -> {r.status_code}, body={r.text}")
        failed += 1

    # -----------------------------------
    # Projects
    # -----------------------------------
    project_name = "My Project"
    info("Creating project (or resolving existing)")
    r = session.post(f"{BASE_URL}/projects", json={"user_id": user_id, "project_name": project_name})
    if r.status_code == 200:
        project_id = (expect_json(r) or {}).get("project_id")
        if project_id:
            ok("POST /projects (created)")
            passed += 1
        else:
            fail(f"POST /projects (created) but no project_id: {r.text}")
            failed += 1
    elif r.status_code == 400 and (expect_json(r) or {}).get("detail") == "Project already exists":
        project_id = find_project_id_by_name(user_id, project_name)
        if project_id:
            ok("POST /projects -> already exists, resolved project_id")
            passed += 1
        else:
            fail("POST /projects -> already exists, but could not resolve project_id from /projects")
            failed += 1
    elif r.status_code == 404:
        fail("POST /projects -> 404 (User not found?) Ensure the user exists.")
        failed += 1
        project_id = None
    else:
        fail(f"POST /projects -> {r.status_code}, body={r.text}")
        failed += 1
        project_id = None

    info("GET /projects")
    r = session.get(f"{BASE_URL}/projects")
    if r.status_code == 200 and isinstance(expect_json(r), list):
        ok("GET /projects")
        passed += 1
    else:
        fail(f"GET /projects -> {r.status_code}, body={r.text}")
        failed += 1

    info("GET /projects/user/{user_id}")
    r = session.get(f"{BASE_URL}/projects/user/{user_id}")
    if r.status_code == 200 and isinstance(expect_json(r), list):
        ok("GET /projects/user/{user_id}")
        passed += 1
    else:
        fail(f"GET /projects/user/{{user_id}} -> {r.status_code}, body={r.text}")
        failed += 1

    info("GET /projects/{project_id}")
    if project_id:
        r = session.get(f"{BASE_URL}/projects/{project_id}")
        data = expect_json(r) or {}
        if r.status_code == 200 and data.get("_id") == project_id:
            ok("GET /projects/{project_id}")
            passed += 1
        else:
            fail(f"GET /projects/{{project_id}} -> {r.status_code}, body={r.text}")
            failed += 1

    info("GET /projects/{BAD_ID} expecting 404")
    r = session.get(f"{BASE_URL}/projects/{BAD_ID}")
    if r.status_code == 404:
        ok("GET /projects/{BAD_ID} -> 404 as expected")
        passed += 1
    else:
        fail(f"GET /projects/{{BAD_ID}} -> {r.status_code}, body={r.text}")
        failed += 1

    info("PUT /projects/{project_id}?project_name=New%20Name")
    if project_id:
        r = session.put(f"{BASE_URL}/projects/{project_id}", params={"project_name": "New Name"})
        if r.status_code == 200 and (expect_json(r) or {}).get("project_id") == project_id:
            ok("PUT /projects/{project_id}")
            passed += 1
        else:
            fail(f"PUT /projects/{{project_id}} -> {r.status_code}, body={r.text}")
            failed += 1

    # -----------------------------------
    # Chats (UPDATED for new schema)
    # -----------------------------------
    chat_title = "First chat"
    info("Creating chat (or resolving existing)")
    # NOW INCLUDES user_id and no messages field
    r = session.post(
        f"{BASE_URL}/chats",
        json={
            "project_id": project_id,
            "user_id": user_id,  # NEW: required field
            "title": chat_title
        }
    )
    if r.status_code == 200:
        chat_id = (expect_json(r) or {}).get("chat_id")
        if chat_id:
            ok("POST /chats (created)")
            passed += 1
        else:
            fail(f"POST /chats (created) but no chat_id: {r.text}")
            failed += 1
    elif r.status_code == 404:
        fail("POST /chats -> 404 (Project not found?) Ensure the project exists.")
        failed += 1
        chat_id = None
    else:
        # If server dedupes, try to find existing by title
        chat_id = find_chat_id_by_title(project_id, chat_title)
        if chat_id:
            ok("POST /chats -> resolved existing chat_id")
            passed += 1
        else:
            fail(f"POST /chats -> {r.status_code}, body={r.text}")
            failed += 1
            chat_id = None

    # DEPRECATED ENDPOINT TEST
    info("PUT /bulk/messages/{chat_id} expecting 410 (deprecated)")
    if chat_id:
        bulk_msgs = [
            {"role": "user", "content": "Hello"},
            {"role": "assistant", "content": "Hi!"}
        ]
        r = session.put(f"{BASE_URL}/bulk/messages/{chat_id}", json=bulk_msgs)
        if r.status_code == 410:
            ok("PUT /bulk/messages/{chat_id} -> 410 (deprecated as expected)")
            passed += 1
        else:
            # If endpoint still works (backward compatibility), accept it
            data = expect_json(r) or {}
            if r.status_code == 200 and data.get("status") == "success":
                warn("PUT /bulk/messages/{chat_id} -> still works (not yet deprecated)")
                passed += 1
            else:
                fail(f"PUT /bulk/messages/{{chat_id}} -> {r.status_code}, body={r.text}")
                failed += 1

    info("GET /chats")
    r = session.get(f"{BASE_URL}/chats")
    if r.status_code == 200 and isinstance(expect_json(r), list):
        ok("GET /chats")
        passed += 1
    else:
        fail(f"GET /chats -> {r.status_code}, body={r.text}")
        failed += 1

    info("GET /chats/project/{project_id}")
    r = session.get(f"{BASE_URL}/chats/project/{project_id}")
    if r.status_code == 200 and isinstance(expect_json(r), list):
        ok("GET /chats/project/{project_id}")
        passed += 1
    else:
        fail(f"GET /chats/project/{{project_id}} -> {r.status_code}, body={r.text}")
        failed += 1

    info("GET /chats/user/{user_id}")
    r = session.get(f"{BASE_URL}/chats/user/{user_id}")
    if r.status_code == 200 and isinstance(expect_json(r), list):
        ok("GET /chats/user/{user_id}")
        passed += 1
    else:
        fail(f"GET /chats/user/{{user_id}} -> {r.status_code}, body={r.text}")
        failed += 1

    info("GET /chats/{chat_id}")
    if chat_id:
        r = session.get(f"{BASE_URL}/chats/{chat_id}")
        data = expect_json(r) or {}
        if r.status_code == 200 and data.get("_id") == chat_id:
            ok("GET /chats/{chat_id}")
            passed += 1
        else:
            fail(f"GET /chats/{{chat_id}} -> {r.status_code}, body={r.text}")
            failed += 1

    info("GET /chats/{BAD_ID} expecting 404")
    r = session.get(f"{BASE_URL}/chats/{BAD_ID}")
    if r.status_code == 404:
        ok("GET /chats/{BAD_ID} -> 404 as expected")
        passed += 1
    else:
        fail(f"GET /chats/{{BAD_ID}} -> {r.status_code}, body={r.text}")
        failed += 1

    # NEW ENDPOINT: Get messages from checkpointer
    info("GET /chats/{chat_id}/messages")
    if chat_id:
        r = session.get(f"{BASE_URL}/chats/{chat_id}/messages")
        data = expect_json(r) or {}
        if r.status_code == 200 and "messages" in data:
            ok("GET /chats/{chat_id}/messages")
            passed += 1
        else:
            fail(f"GET /chats/{{chat_id}}/messages -> {r.status_code}, body={r.text}")
            failed += 1

    # NEW ENDPOINT: Update chat metadata
    info("PUT /chats/{chat_id}/metadata")
    if chat_id:
        test_metadata = {
            "summary": "A test conversation",
            "tags": ["test", "automated"],
            "topics_discussed": ["databases", "api"]
        }
        r = session.put(f"{BASE_URL}/chats/{chat_id}/metadata", json=test_metadata)
        data = expect_json(r) or {}
        if r.status_code == 200 and data.get("status") == "success":
            ok("PUT /chats/{chat_id}/metadata")
            passed += 1
        else:
            fail(f"PUT /chats/{{chat_id}}/metadata -> {r.status_code}, body={r.text}")
            failed += 1

        # Verify metadata was saved
        info("Verifying metadata was saved")
        r = session.get(f"{BASE_URL}/chats/{chat_id}")
        data = expect_json(r) or {}
        if r.status_code == 200 and data.get("metadata", {}).get("summary") == "A test conversation":
            ok("Metadata verification successful")
            passed += 1
        else:
            fail(f"Metadata verification failed: {r.text}")
            failed += 1

    # -----------------------------------
    # Topics (UPDATED with user_id)
    # -----------------------------------
    topic_name = "Databases"
    info("POST /add_topic_to_chat")
    r = session.post(
        f"{BASE_URL}/add_topic_to_chat",
        json={"user_id": user_id, "chat_id": chat_id, "name": topic_name}
    )
    data = expect_json(r) or {}
    if r.status_code == 200 and data.get("status") == "success":
        ok("POST /add_topic_to_chat")
        passed += 1
    else:
        fail(f"POST /add_topic_to_chat -> {r.status_code}, body={r.text}")
        failed += 1

    info("PUT /update_topic_level_of_understanding")
    r = session.put(
        f"{BASE_URL}/update_topic_level_of_understanding",
        json={"user_id": user_id, "name": topic_name, "level_of_understanding": "Advanced"}
    )
    data = expect_json(r) or {}
    if r.status_code == 200 and data.get("status") == "success":
        ok("PUT /update_topic_level_of_understanding")
        passed += 1
    else:
        fail(f"PUT /update_topic_level_of_understanding -> {r.status_code}, body={r.text}")
        failed += 1

    info("GET /topics")
    r = session.get(f"{BASE_URL}/topics")
    if r.status_code == 200 and isinstance(expect_json(r), list):
        ok("GET /topics")
        passed += 1
    else:
        fail(f"GET /topics -> {r.status_code}, body={r.text}")
        failed += 1

    # NEW ENDPOINT: Get topics by user
    info("GET /topics/user/{user_id}")
    r = session.get(f"{BASE_URL}/topics/user/{user_id}")
    if r.status_code == 200 and isinstance(expect_json(r), list):
        ok("GET /topics/user/{user_id}")
        passed += 1
    else:
        fail(f"GET /topics/user/{{user_id}} -> {r.status_code}, body={r.text}")
        failed += 1

    # UPDATED: Now requires user_id parameter
    info("GET /topics/{topic_name}?user_id={user_id}")
    r = session.get(f"{BASE_URL}/topics/{topic_name}", params={"user_id": user_id})
    data = expect_json(r) or {}
    if r.status_code == 200 and data.get("name") == topic_name:
        ok("GET /topics/{topic_name}?user_id={user_id}")
        passed += 1
    else:
        fail(f"GET /topics/{{topic_name}}?user_id={{user_id}} -> {r.status_code}, body={r.text}")
        failed += 1

    # UPDATED: Now requires user_id parameter
    info("GET /topic_chats/{topic_name}?user_id={user_id}")
    r = session.get(f"{BASE_URL}/topic_chats/{topic_name}", params={"user_id": user_id})
    data = expect_json(r) or {}
    if r.status_code == 200 and data.get("status") == "success" and "chats" in data:
        ok("GET /topic_chats/{topic_name}?user_id={user_id}")
        passed += 1
    else:
        fail(f"GET /topic_chats/{{topic_name}}?user_id={{user_id}} -> {r.status_code}, body={r.text}")
        failed += 1

    # Test nonexistent topic with user_id
    info("GET /topics/ThisTopicShouldNotExist?user_id={user_id} expecting 404")
    r = session.get(f"{BASE_URL}/topics/ThisTopicShouldNotExist", params={"user_id": user_id})
    if r.status_code == 404:
        ok("GET /topics/nonexistent?user_id={user_id} -> 404 as expected")
        passed += 1
    else:
        fail(f"GET /topics/nonexistent?user_id={{user_id}} -> {r.status_code}, body={r.text}")
        failed += 1

    # -----------------------------------
    # Summary
    # -----------------------------------
    print("\n" + "="*60)
    print(f"{Colors.BOLD}Test Summary{Colors.RESET}")
    print(f"{Colors.GREEN}Passed: {passed}{Colors.RESET}")
    print(f"{Colors.RED}Failed: {failed}{Colors.RESET}")
    print("="*60)

if __name__ == "__main__":
    main()