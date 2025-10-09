// src/api/data_api.jsx
import axios from "axios";

/**
 * Base URL for your main FastAPI (users/spaces/chats).
 * Override via .env: VITE_DATA_API_BASE="http://127.0.0.1:8000"
 */
export const DATA_API_BASE =
  import.meta.env.VITE_DATA_API_BASE || "http://127.0.0.1:8000";

/** One axios client for everything */
export const http = axios.create({
  baseURL: DATA_API_BASE,
  timeout: 8000,
});

/** Fast fail with a readable error if the API is down or port is wrong */
const ping = async () => {
  try {
    const r = await http.get("/health", { timeout: 3000 });
    if (!r?.data || r.data.status !== "ok") {
      throw new Error("Health not ok");
    }
  } catch (e) {
    throw new Error(
      `Backend unreachable at ${DATA_API_BASE}. Is FastAPI running on this port?`
    );
  }
};

/**
 * Resolve a valid Mongo ObjectId user id.
 * - Uses localStorage if available
 * - Otherwise creates (or finds) a dev user and stores it.
 */
const getUserId = async () => {
  let user_id = localStorage.getItem("user_id");
  if (user_id) return user_id;

  await ping();

  // Try creating a dev user first
  try {
    const created = await http.post("/users", {
      name: "Dev User",
      email: "dev@local.test",
    });
    user_id = created?.data?.user_id;
  } catch {
    // If already exists, fetch and match by email
    const all = await http.get("/users");
    const match = (all.data || []).find((u) => u.email === "dev@local.test");
    user_id = match?._id;
  }

  if (!user_id) {
    throw new Error("Could not resolve user_id (creation/lookup failed).");
  }

  localStorage.setItem("user_id", user_id);
  return user_id;
};

// ----------------- SPACES -----------------

export const getSpaces = async () => {
  await ping();
  const user_id = await getUserId();
  const { data } = await http.get(`/spaces/user/${user_id}`);
  return data;
};

export const createSpace = async (space_name) => {
  await ping();
  const user_id = await getUserId();
  const { data } = await http.post(`/spaces`, { user_id, space_name });
  if (data?.status === "success") return data.space_id;
  throw new Error(data?.detail || "Create space failed");
};

export const renameSpace = async (space_id, new_name) => {
  await ping();
  const { data } = await http.put(`/spaces/${space_id}`, null, {
    params: { space_name: new_name },
  });
  return data;
};

export const deleteSpace = async (space_id) => {
  await ping();
  const { data } = await http.delete(`/spaces/${space_id}`);
  return data;
};

// ----------------- CHATS -----------------

export const getChatsSpace = async (space_id) => {
  await ping();
  const { data } = await http.get(`/chats/space/${space_id}`);
  return data;
};

export const getChatsUser = async () => {
  await ping();
  const user_id = await getUserId();
  const { data } = await http.get(`/chats/user/${user_id}`);
  return data;
};

export const createChat = async (space_id, title) => {
  await ping();
  const payload = { space_id, title, messages: [] };
  const { data } = await http.post(`/chats`, payload);
  if (data?.status === "success") return data.chat_id;
  throw new Error(data?.detail || "Create chat failed");
};

export const getChatById = async (chat_id) => {
  await ping();
  const { data } = await http.get(`/chats/${chat_id}`);
  return data;
};

export const bulkAppendMessages = async (chat_id, messages /* array */) => {
  await ping();
  const { data } = await http.put(`/bulk/messages/${chat_id}`, messages);
  return data;
};

export const deleteChat = async (chat_id) => {
  await ping();
  const { data } = await http.delete(`/chats/${chat_id}`);
  return data;
};