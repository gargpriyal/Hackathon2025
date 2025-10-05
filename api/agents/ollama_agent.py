# apps/api/agents/ollama_agent.py
from __future__ import annotations

import os
import asyncio
import json
from typing import AsyncGenerator, Optional, Dict, Any, List

import httpx

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
DEFAULT_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:latest")

async def _ensure_model(model: str = DEFAULT_MODEL) -> None:
    """
    (Optional) Best-effort pull. If the model isn't present, this can be slow.
    You may comment this out if you always pre-pull models manually:
    `ollama pull llama3.1:8b`
    """
    # We won't auto-pull to avoid long waits in dev flows.
    return

async def generate_once(
    prompt: str,
    model: str = DEFAULT_MODEL,
    system: Optional[str] = None,
    temperature: float = 0.2,
) -> str:
    """
    Single-shot completion using /api/generate (non-stream).
    """
    await _ensure_model(model)
    payload: Dict[str, Any] = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": temperature,
        },
    }
    
    # Add system prompt if provided (better approach)
    if system:
        payload["system"] = system
    
    async with httpx.AsyncClient(timeout=60.0) as client:  # Added reasonable timeout
        r = await client.post(f"{OLLAMA_HOST}/api/generate", json=payload)
        r.raise_for_status()
        data = r.json()
        return data.get("response", "")

async def stream_generate(
    prompt: str,
    model: str = DEFAULT_MODEL,
    system: Optional[str] = None,
    temperature: float = 0.2,
) -> AsyncGenerator[str, None]:
    """
    Streaming tokens using /api/generate (stream=True).
    Yields token-sized substrings as they arrive.
    """
    await _ensure_model(model)
    payload: Dict[str, Any] = {
        "model": model,
        "prompt": prompt,
        "stream": True,
        "options": {
            "temperature": temperature,
        },
    }
    
    # Add system prompt if provided
    if system:
        payload["system"] = system
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        async with client.stream("POST", f"{OLLAMA_HOST}/api/generate", json=payload) as r:
            r.raise_for_status()
            async for line in r.aiter_lines():
                if not line.strip():
                    continue
                # Ollama streams JSON per line
                try:
                    obj = json.loads(line)
                except json.JSONDecodeError:
                    continue
                chunk = obj.get("response", "")
                if chunk:
                    yield chunk
                if obj.get("done"):
                    break

async def stream_chat(
    messages: List[Dict[str, str]],
    model: str = DEFAULT_MODEL,
    temperature: float = 0.2,
) -> AsyncGenerator[str, None]:
    """
    Chat-style streaming using /api/chat (stream=True).
    `messages` is a list like:
      [{"role":"system","content":"You are helpful."},
       {"role":"user","content":"Hello"}]
    """
    await _ensure_model(model)
    payload: Dict[str, Any] = {
        "model": model,
        "messages": messages,
        "stream": True,
        "options": {
            "temperature": temperature,
        },
    }
    # print(payload)
    async with httpx.AsyncClient(timeout=None) as client:
        async with client.stream("POST", f"{OLLAMA_HOST}/api/chat", json=payload) as r:
            r.raise_for_status()
            async for line in r.aiter_lines():
                if not line:
                    continue
                try:
                    obj = json.loads(line)
                except json.JSONDecodeError:
                    continue

                # Handle both formats:
                # - {"message":{"content":"..."}, "done": false}
                # - {"response":"...", "done": false}
                chunk = None
                msg = obj.get("message")
                # print(msg)
                if isinstance(msg, dict):
                    chunk = msg.get("content")
                if not chunk:
                    chunk = obj.get("response")

                if chunk:
                    yield chunk
                if obj.get("done"):
                    break

# Tiny utility to chunk plain text into "tokens" (optional)
async def fake_tokenizer(text: str, delay: float = 0.02) -> AsyncGenerator[str, None]:
    for part in text.split(" "):
        yield part + " "
        await asyncio.sleep(delay)