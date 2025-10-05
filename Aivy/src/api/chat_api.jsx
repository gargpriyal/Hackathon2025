import axios from "axios";

const API_BASE = "http://127.0.0.1:8001";

export const chat = async (chat_id, content, space_id) => {
    const data = {
        "chat_id": chat_id,
        "content": content,
        "space_id": space_id,
    }
    console.log("Data", data);
    
    const response = await axios.post(`${API_BASE}/chat`, data);
    console.log("Response", response.data);
    const res = response.data;
    if (res) {
        return res;
    } else {
        throw new Error(res);
    }
}