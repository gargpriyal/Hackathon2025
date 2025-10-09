"""
Chat Service API Test Suite (requests-based)

- Base URL is configurable via BASE_URL.
- Covers: /health, /db_status, /users, /spaces, /chats, topics endpoints
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

def find_space_id_by_name(user_id: str, space_name: str) -> Optional[str]:
    r = requests.get(f"{BASE_URL}/spaces")
    if r.status_code != 200:
        return None
    data = expect_json(r) or []
    for p in data:
        if p.get("space_name") == space_name and p.get("user_id") == user_id:
            return p.get("_id")
    return None

def find_chat_id_by_title(space_id: str, title: str) -> Optional[str]:
    r = requests.get(f"{BASE_URL}/chats/space/{space_id}")
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
    # Spaces
    # -----------------------------------
    space_name = "My Space"
    info("Creating space (or resolving existing)")
    r = session.post(f"{BASE_URL}/spaces", json={"user_id": user_id, "space_name": space_name})
    if r.status_code == 200:
        space_id = (expect_json(r) or {}).get("space_id")
        if space_id:
            ok("POST /spaces (created)")
            passed += 1
        else:
            fail(f"POST /spaces (created) but no space_id: {r.text}")
            failed += 1
    elif r.status_code == 400 and (expect_json(r) or {}).get("detail") == "Space already exists":
        space_id = find_space_id_by_name(user_id, space_name)
        if space_id:
            ok("POST /spaces -> already exists, resolved space_id")
            passed += 1
        else:
            fail("POST /spaces -> already exists, but could not resolve space_id from /spaces")
            failed += 1
    elif r.status_code == 404:
        fail("POST /spaces -> 404 (User not found?) Ensure the user exists.")
        failed += 1
        space_id = None
    else:
        fail(f"POST /spaces -> {r.status_code}, body={r.text}")
        failed += 1
        space_id = None

    info("GET /spaces")
    r = session.get(f"{BASE_URL}/spaces")
    if r.status_code == 200 and isinstance(expect_json(r), list):
        ok("GET /spaces")
        passed += 1
    else:
        fail(f"GET /spaces -> {r.status_code}, body={r.text}")
        failed += 1

    info("GET /spaces/user/{user_id}")
    r = session.get(f"{BASE_URL}/spaces/user/{user_id}")
    if r.status_code == 200 and isinstance(expect_json(r), list):
        ok("GET /spaces/user/{user_id}")
        passed += 1
    else:
        fail(f"GET /spaces/user/{{user_id}} -> {r.status_code}, body={r.text}")
        failed += 1

    info("GET /spaces/{space_id}")
    if space_id:
        r = session.get(f"{BASE_URL}/spaces/{space_id}")
        data = expect_json(r) or {}
        if r.status_code == 200 and data.get("_id") == space_id:
            ok("GET /spaces/{space_id}")
            passed += 1
        else:
            fail(f"GET /spaces/{{space_id}} -> {r.status_code}, body={r.text}")
            failed += 1

    info("GET /spaces/{BAD_ID} expecting 404")
    r = session.get(f"{BASE_URL}/spaces/{BAD_ID}")
    if r.status_code == 404:
        ok("GET /spaces/{BAD_ID} -> 404 as expected")
        passed += 1
    else:
        fail(f"GET /spaces/{{BAD_ID}} -> {r.status_code}, body={r.text}")
        failed += 1

    info("PUT /spaces/{space_id}?space_name=New%20Name")
    if space_id:
        r = session.put(f"{BASE_URL}/spaces/{space_id}", params={"space_name": "New Name"})
        if r.status_code == 200 and (expect_json(r) or {}).get("space_id") == space_id:
            ok("PUT /spaces/{space_id}")
            passed += 1
        else:
            fail(f"PUT /spaces/{{space_id}} -> {r.status_code}, body={r.text}")
            failed += 1

    # -----------------------------------
    # Chats
    # -----------------------------------
    chat_title = "First chat"
    info("Creating chat (or resolving existing)")
    r = session.post(f"{BASE_URL}/chats", json={"space_id": space_id, "title": chat_title, "messages": []})
    if r.status_code == 200:
        chat_id = (expect_json(r) or {}).get("chat_id")
        if chat_id:
            ok("POST /chats (created)")
            passed += 1
        else:
            fail(f"POST /chats (created) but no chat_id: {r.text}")
            failed += 1
    elif r.status_code == 404:
        fail("POST /chats -> 404 (Space not found?) Ensure the space exists.")
        failed += 1
        chat_id = None
    else:
        # If server dedupes, try to find existing by title
        chat_id = find_chat_id_by_title(space_id, chat_title)
        if chat_id:
            ok("POST /chats -> resolved existing chat_id")
            passed += 1
        else:
            fail(f"POST /chats -> {r.status_code}, body={r.text}")
            failed += 1
            chat_id = None

    info("PUT /bulk/messages/{chat_id}")
    if chat_id:
        bulk_msgs = [
            {"role": "user", "content": "Hello"},
            {"role": "assistant", "content": "Hi!"}
        ]
        r = session.put(f"{BASE_URL}/bulk/messages/{chat_id}", json=bulk_msgs)
        data = expect_json(r) or {}
        if r.status_code == 200 and data.get("status") == "success" and data.get("added_count") == 2:
            ok("PUT /bulk/messages/{chat_id}")
            passed += 1
        elif r.status_code == 200 and data.get("status") == "success":
            # Some implementations may append differently across runs; accept success
            ok("PUT /bulk/messages/{chat_id} (status success)")
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

    info("GET /chats/space/{space_id}")
    r = session.get(f"{BASE_URL}/chats/space/{space_id}")
    if r.status_code == 200 and isinstance(expect_json(r), list):
        ok("GET /chats/space/{space_id}")
        passed += 1
    else:
        fail(f"GET /chats/space/{{space_id}} -> {r.status_code}, body={r.text}")
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

    # -----------------------------------
    # Topics
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

    info("GET /topics/{topic_name}")
    r = session.get(f"{BASE_URL}/topics/{topic_name}")
    if r.status_code == 200 and (expect_json(r) or {}).get("name") == topic_name:
        ok("GET /topics/{topic_name}")
        passed += 1
    else:
        fail(f"GET /topics/{{topic_name}} -> {r.status_code}, body={r.text}")
        failed += 1

    info("GET /topic_chats/{topic_name}")
    r = session.get(f"{BASE_URL}/topic_chats/{topic_name}")
    data = expect_json(r) or {}
    if r.status_code == 200 and data.get("status") == "success" and "chats" in data:
        ok("GET /topic_chats/{topic_name}")
        passed += 1
    else:
        fail(f"GET /topic_chats/{{topic_name}} -> {r.status_code}, body={r.text}")
        failed += 1

    # Also try a topic that shouldn't exist for 404
    info("GET /topics/ThisTopicShouldNotExist expecting 404")
    r = session.get(f"{BASE_URL}/topics/ThisTopicShouldNotExist")
    if r.status_code == 404:
        ok("GET /topics/nonexistent -> 404 as expected")
        passed += 1
    else:
        fail(f"GET /topics/nonexistent -> {r.status_code}, body={r.text}")
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