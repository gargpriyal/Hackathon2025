# apps/api/main.py
from __future__ import annotations

import os
from typing import Optional, AsyncGenerator, List, Dict, Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
import httpx
import json
from fastapi import Query, UploadFile, File, Form

from agents.ollama_agent import generate_once, stream_generate, stream_chat
import uuid
from pathlib import Path
from starlette.responses import JSONResponse

UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "./uploads")).resolve()
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_MIME_PREFIXES = ("text/", "image/")
ALLOWED_EXTS = {
    ".txt", ".md", ".pdf", ".doc", ".docx",
    ".png", ".jpg", ".jpeg", ".webp"
}
MAX_UPLOAD_MB = float(os.getenv("MAX_UPLOAD_MB", "25"))  # 25 MB default

def _safe_ext(filename: str) -> str:
    ext = Path(filename).suffix.lower()
    return ext if ext in ALLOWED_EXTS else ""



APP_PORT = int(os.getenv("API_PORT", "8787"))
FRONTEND_PORTS = os.getenv("FRONTEND_PORTS", "5173,5174,5175,5176")

app = FastAPI(title="AIVY Chat API (Ollama)")

# CORS for local dev
allowed = [f"http://localhost:{p.strip()}" for p in FRONTEND_PORTS.split(",")]
app.add_middleware(
    CORSMiddleware,
    # allow_origins=allowed,
    allow_origins = ["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------- Schemas ---------
class ChatMessage(BaseModel):
    role: str = Field(..., description="user|assistant|system")
    content: str

class StreamRequest(BaseModel):
    conversation_id: Optional[str] = None
    message: str
    system_prompt: Optional[str] = None
    model: Optional[str] = None
    temperature: Optional[float] = 0.2
    use_chat_endpoint: Optional[bool] = True

class NonStreamRequest(BaseModel):
    message: str
    system_prompt: Optional[str] = None
    model: Optional[str] = None
    temperature: Optional[float] = 0.2

# --------- Routes ---------
@app.get("/api/health")
async def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.post("/api/uploads")
async def upload_files(
    files: list[UploadFile] = File(..., description="One or more files"),
    conversation_id: str | None = Form(default=None),
):
    saved = []
    for f in files:
        # simple validations
        ext = _safe_ext(f.filename or "")
        if not ext:
            return JSONResponse(
                status_code=400,
                content={"error": {"code": "bad_extension", "message": f"Unsupported file type: {f.filename}"}},
            )

        # enforce size in-memory chunking
        size = 0
        file_id = str(uuid.uuid4())
        dest = UPLOAD_DIR / f"{file_id}{ext}"

        with dest.open("wb") as out:
            while True:
                chunk = await f.read(1024 * 1024)  # 1 MB
                if not chunk:
                    break
                size += len(chunk)
                if size > MAX_UPLOAD_MB * 1024 * 1024:
                    dest.unlink(missing_ok=True)
                    return JSONResponse(
                        status_code=413,
                        content={"error": {"code": "too_large", "message": f"{f.filename} exceeds {MAX_UPLOAD_MB} MB"}},
                    )
                out.write(chunk)

        saved.append(
            {
                "id": file_id,
                "filename": f.filename,
                "size": size,
                "ext": ext,
                "mime_type": f.content_type or "application/octet-stream",
                "conversation_id": conversation_id,
                # In dev we just expose a local file path. You could later serve via /static.
                "path": str(dest),
            }
        )

    # helpful log
    print(f"[upload] convo={conversation_id} -> {len(saved)} file(s)")
    return {"ok": True, "files": saved}

@app.get("/api/models")
async def list_models() -> List[Dict[str, Any]]:
    """
    Ask Ollama which models are available (ollama /api/tags).
    """
    host = os.getenv("OLLAMA_HOST", "http://localhost:11434")
    async with httpx.AsyncClient(timeout=5.0) as client:
        try:
            r = await client.get(f"{host}/api/tags")
            r.raise_for_status()
            data = r.json()
            models = data.get("models", [])
        except Exception:
            # Fallback if ollama is not up
            models = [{"name": os.getenv("OLLAMA_MODEL", "llama3.2:latest")}]
    # Normalize to a simple {id, context} shape used by UI
    return [{"id": m.get("name", "unknown"), "context": m.get("details", {}).get("parameter_size", "N/A")} for m in models]

@app.post("/api/messages")
async def create_message(req: NonStreamRequest) -> Dict[str, Any]:
    """
    Non-stream reply. Good for quick tests.
    """
    try:
        if req.system_prompt:
            text = await generate_once(
                prompt=req.message, system=req.system_prompt, model=req.model or os.getenv("OLLAMA_MODEL", "llama3.2:latest"),
                temperature=req.temperature or 0.2
            )
        else:
            text = await generate_once(
                prompt=req.message, system=None, model=req.model or os.getenv("OLLAMA_MODEL", "llama3.2:latest"),
                temperature=req.temperature or 0.2
            )
        return {"ok": True, "reply": text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/messages/stream")
async def stream_message(req: StreamRequest):
    async def sse():
        try:
            messages: List[Dict[str, str]] = []
            if req.system_prompt:
                messages.append({"role": "system", "content": req.system_prompt})
            messages.append({"role": "user", "content": req.message})

            async for chunk in stream_chat(
                messages=messages,
                model=req.model or os.getenv("OLLAMA_MODEL", "llama3.2:latest"),
                temperature=req.temperature or 0.2,
            ):
                # ✅ Proper JSON (double quotes) — no more !r
                print(f"[STREAM CHUNK] {chunk}")
                yield "data: " + json.dumps({"token": chunk}) + "\n\n"

        except Exception as e:
            # ✅ Proper JSON for errors
            yield "data: " + json.dumps({"error": str(e)}) + "\n\n"
        # finally:
        #     # ✅ Proper JSON for done
        #     yield "data: " + json.dumps({"done": True}) + "\n\n"

    return StreamingResponse(
        sse(),
        media_type="text/event-stream; charset=utf-8",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
    
    

FLASHCARD_SETS: Dict[str, List[Dict[str, Any]]] = {
    "all": [
        {"id": "q1", "question": "Which data structure uses LIFO?", "options": ["Queue", "Stack", "Heap", "Graph"], "correctIndex": 1},
        {"id": "q2", "question": "What does HTTP stand for?", "options": ["HyperText Transfer Protocol", "High Transfer Text Protocol"], "correctIndex": 0},
        {"id": "q3", "question": "Pick a prime number", "options": ["9", "11", "15", "21", "12323"], "correctIndex": 1},
    ],
    "work": [
        {"id": "w1", "question": "Git: which command creates a new branch?", "options": ["git switch -c", "git make branch", "git new"], "correctIndex": 0},
        {"id": "w2", "question": "CI stands for…", "options": ["Continuous Integration", "Code Inspection", "Container Instance"], "correctIndex": 0},
    ],
    "personal": [
        {"id": "p1", "question": "Healthy sleep range for adults?", "options": ["3-4h", "5-6h", "7-9h", "10-12h"], "correctIndex": 2},
        {"id": "p2", "question": "Which boosts learning retention?", "options": ["Spaced repetition", "All-nighters", "Only highlighting"], "correctIndex": 0},
    ],
}

@app.get("/api/flashcards")
async def get_flashcards(group: str = Query("all")):
    key = (group or "all").lower()
    if key not in FLASHCARD_SETS:
        key = "all"
    data = {"cards": FLASHCARD_SETS[key]}
    # helpful server-side log:
    print(f"[flashcards] group='{group}' -> key='{key}', count={len(data['cards'])}")
    return data


# async def stream_message(req: StreamRequest):
#     """
#     SSE streaming endpoint. Emits `data: {"token": "..."}` per chunk and a final
#     `data: {"done": true}`.
#     """

#     async def sse() -> AsyncGenerator[bytes, None]:
#         try:
#             if req.use_chat_endpoint:
#                 # Chat-style with roles: [system?, user]
#                 messages: List[ChatMessage] = []
#                 if req.system_prompt:
#                     messages.append(ChatMessage(role="system", content=req.system_prompt))
#                 messages.append(ChatMessage(role="user", content=req.message))

#                 async for chunk in stream_chat(
#                     messages=[m.model_dump() for m in messages],
#                     model=req.model or os.getenv("OLLAMA_MODEL", "llama3.2:latest"),
#                     temperature=req.temperature or 0.2,
#                 ):
#                     yield f'data: {{"token": {chunk!r}}}\n\n'.encode("utf-8")
#             else:
#                 # Simple prompt-based generate
#                 async for chunk in stream_generate(
#                     prompt=req.message,
#                     model=req.model or os.getenv("OLLAMA_MODEL", "llama3.2:latest"),
#                     system=req.system_prompt,
#                     temperature=req.temperature or 0.2,
#                 ):
#                     yield f'data: {{"token": {chunk!r}}}\n\n'.encode("utf-8")
#         except Exception as e:
#             # Send one error frame to client
#             yield f'data: {{"error": {str(e)!r}}}\n\n'.encode("utf-8")
#         finally:
#             # Always send done
#             yield b'data: {"done": true}\n\n'

#     return StreamingResponse(sse(), media_type="text/event-stream")
