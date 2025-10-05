import sys
import requests

BASE = "http://127.0.0.1:8000"

# Only use the GET /flashcards API
url = f"{BASE}/flashcards"

resp = requests.get(url)
print("status:", resp.status_code)
if resp.status_code != 200:
    print(resp.text)
    sys.exit(1)

try:
    data = resp.json()
except Exception:
    print("response not JSON:\n", resp.text)
    sys.exit(1)

flashcards = data.get("flashcards")
if flashcards is None:
    print("Missing 'flashcards' key in response:\n", data)
    sys.exit(2)

if not isinstance(flashcards, list):
    print("'flashcards' is not a list:\n", type(flashcards), flashcards)
    sys.exit(3)

if len(flashcards) == 0:
    print("Warning: no flashcards returned (empty list). Test passes but nothing to validate further.")
    sys.exit(0)

# Validate shape of each flashcard
for i, fc in enumerate(flashcards[:20]):  # check up to first 20
    if not isinstance(fc, dict):
        print(f"flashcard #{i} is not an object:\n", fc)
        sys.exit(4)
    # required fields
    if "question" not in fc or not isinstance(fc.get("question"), str):
        print(f"flashcard #{i} missing or invalid 'question':", fc)
        sys.exit(5)
    if "options" not in fc or not isinstance(fc.get("options"), list):
        print(f"flashcard #{i} missing or invalid 'options':", fc)
        sys.exit(6)
    if "correctOption" not in fc or not isinstance(fc.get("correctOption"), int):
        print(f"flashcard #{i} missing or invalid 'correctOption':", fc)
        sys.exit(7)
    if "topicId" not in fc or not isinstance(fc.get("topicId"), str):
        print(f"flashcard #{i} missing or invalid 'topicId':", fc)
        sys.exit(8)
    if "spaceId" not in fc or not isinstance(fc.get("spaceId"), str):
        print(f"flashcard #{i} missing or invalid 'spaceId':", fc)
        sys.exit(9)

print(flashcards)

print(f"Validated {min(len(flashcards), 20)} flashcards' shape successfully.")
sys.exit(0)
