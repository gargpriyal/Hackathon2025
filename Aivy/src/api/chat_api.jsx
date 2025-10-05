import axios from "axios";

const API_BASE = "http://127.0.0.1:8001";

export const chat = async (chat_id, content, space_id) => {
    const response = await axios.post(`${API_BASE}/chat`, {
        "chat_id": chat_id,
        "content": content,
        "space_id": space_id,
    });
    data = response.data;
    if (data.status === "success") {
        return data.message;
    } else {
        throw new Error(data.detail);
    }
}