import axios from "axios";

const API_BASE = "http://127.0.0.1:4000";

export const getSpaces = async () => {
  const user_id = localStorage.getItem("user_id");
  if (!user_id) {
    throw new Error("User ID is required");
  }
  const response = await axios.get(`${API_BASE}/spaces/user/${user_id}`);
  return response.data;
};

export const getChatsSpace = async (space_id) => {
  const response = await axios.get(`${API_BASE}/chats/space/${space_id}`);
  return response.data;
};

export const getChatsUser = async () => {
  const user_id = localStorage.getItem("user_id");
  if (!user_id) {
    throw new Error("User ID is required");
  }
  const response = await axios.get(`${API_BASE}/chats/user/${user_id}`);
  return response.data;
};

export const createSpace = async (space_name) => {
  const user_id = localStorage.getItem("user_id");
  if (!user_id) {
    throw new Error("User ID is required");
  }
  const response = await axios.post(`${API_BASE}/spaces`, {
    user_id: user_id,
    space_name: space_name,
  });
  data = response.data;
  if (data.status === "success") {
    return data.space_id;
  } else {
    throw new Error(data.detail);
  }
};

export const createChat = async (space_id, title) => {
  const response = await axios.post(`${API_BASE}/chats`, {
    space_id: space_id,
    title: title,
    messages: [],
  });
  data = response.data;
  if (data.status === "success") {
    return data.chat_id;
  } else {
    throw new Error(data.detail);
  }
};

export const getChatById = async (chat_id) => {
  const response = await axios.get(`${API_BASE}/chats/${chat_id}`);
  return response.data;
};

export const deleteChat = async (chat_id) => {
  const response = await axios.delete(`${API_BASE}/chats/${chat_id}`);
  return response.data;
};