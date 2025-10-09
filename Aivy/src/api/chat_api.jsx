// src/api/chat_api.jsx
import axios from "axios";

/**
 * Base URL for your agent/chat FastAPI (the tutoring agent).
 * Override via .env: VITE_AGENT_API_BASE="http://127.0.0.1:8001"
 */
export const AGENT_API_BASE =
  import.meta.env.VITE_AGENT_API_BASE || "http://127.0.0.1:8001";

const httpAgent = axios.create({
  baseURL: AGENT_API_BASE,
  timeout: 30000, // agent calls can take longer
});

/**
 * Send a user message to the agent for a given chat.
 * The agent backend expects { chat_id, content }.
 * (Do NOT send space_id unless your server requires it.)
 */
export const chat = async (chat_id, content) => {
  const payload = { chat_id, content };
  const { data } = await httpAgent.post(`/chat`, payload);
  // If your agent returns a plain string, return it.
  // If it returns { response: "..."} adapt accordingly:
  // return typeof data === "string" ? data : data?.response;
  return data;
};