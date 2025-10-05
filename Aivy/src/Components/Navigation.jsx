// src/Components/Navigation.jsx
import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  Paperclip,
  Rocket,
  Plus,
  Trash2,
  Folder,
  Store as StoreIcon,
  Brain,
  Bird,
} from "lucide-react";
import Store from "./Store.jsx";
import Flashcard from "./Flashcard.jsx";
import Pet from "./Pet.jsx";
import NewChatDialog from "./NewChatDialog.jsx";
import {
  getSpaces,
  getChatsSpace,
  getChatsUser,
  createChat,
  getChatById,
  deleteChat
} from "../api/data_api.jsx";
import { chat } from "../api/chat_api.jsx";

const API_BASE = "http://127.0.0.1:8787";

/** Fallback local response (only used if stream fails) */
const dummyReply = (text) => {
  if (!text) return "Say something!";
  const t = text.toLowerCase();
  if (t.includes("hello")) return "Hi there! How can I help today?";
  if (t.includes("weather")) return "It’s always sunny in AIVY land ☀️";
  if (t.includes("bye")) return "Goodbye! Come back soon 👋";
  return "This is a dummy AI response. Soon this will be replaced by a real model 🤖.";
};

/** Small helpers */
const SectionTitle = ({ children }) => (
  <div className="px-3 pt-4 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 select-none">
    {children}
  </div>
);

const Divider = () => <div className="my-3 h-px bg-slate-200" />;

const Coin = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="10" fill="#f5d442" />
    <circle cx="12" cy="12" r="6" fill="#fff2a8" />
    <path
      d="M12 7v10M7 12h10"
      stroke="#c9a905"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

/** Top bar — lighter, rounded, subtle shadow */
const TopBar = ({ viewTitle, points, onPointsClick }) => (
  <header className="h-14 border-b border-slate-200 bg-white/90 backdrop-blur px-4 flex items-center justify-between shadow-sm">
    <div className="flex items-center gap-3">
      <div className="rounded-lg bg-slate-900 text-white px-2 py-1 text-xs font-bold shadow">
        AIVY
      </div>
      <div className="text-sm text-slate-400">/</div>
      <h1 className="text-sm font-semibold text-slate-700">{viewTitle}</h1>
    </div>

    <button
      type="button"
      onClick={onPointsClick}
      aria-label="Open points popover"
      className="flex items-center gap-2 rounded-full px-3 py-1.5 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 transition"
    >
      <Coin />
      <span className="font-semibold tabular-nums text-slate-700">
        {points.toLocaleString()}
      </span>
    </button>
  </header>
);

/** Chat view with bubbles + 3D-ish inputs/buttons */
const ChatView = ({ convo, onSend, onDelete, onUpload }) => {
  const [input, setInput] = useState("");
  const fileRef = useRef(null);
  console.log("Convo", convo);

  if (!convo) return <div className="p-6 text-slate-500">No chat selected</div>;

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-3 border-b border-slate-200 text-sm text-slate-600 flex items-center justify-between bg-white">
        <div className="font-medium text-slate-700">{convo.title}</div>
        <button
          onClick={() => onDelete(convo._id)}
          className="inline-flex items-center gap-1.5 text-sm text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-md px-2 py-1 transition"
        >
          <Trash2 className="h-4 w-4" /> Delete
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto px-6 py-6 space-y-4">
        {convo.messages.map((m, idx) => {
          const isUser = m.role === "user";
          const isAssistant = m.role === "assistant";
          const toRender = isUser || isAssistant;
          let content = "";
          if (toRender) {
            if (isUser) {
              content = m.content;
            } else {
              content = m.content[0].text;
            }
          } else {
            return null;
          }
          return (
            toRender && (
              <div
                key={idx}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={
                    isUser
                      ? "max-w-[78%] bg-blue-600 text-white rounded-2xl rounded-tr-md shadow-md px-4 py-2"
                      : "max-w-[78%] bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-tl-md shadow px-4 py-2"
                  }
                >
                  {content}
                </div>
              </div>
            )
          );
        })}
      </div>

      {/* Composer */}
      <div className="border-t border-slate-200 p-3 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const text = input.trim();
            if (!text) return;
            onSend(text);
            setInput("");
          }}
          className="flex items-center gap-2"
        >
          <button
            type="button"
            title="Attach files"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center justify-center rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md px-3 py-2 transition focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            <Paperclip className="h-5 w-5 text-slate-600" />
          </button>
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            multiple
            onChange={(e) => onUpload(Array.from(e.target.files || []))}
          />

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label="Message"
            placeholder="Message AIVY…"
            className="flex-1 rounded-2xl bg-white border border-slate-200 shadow-sm placeholder:text-slate-400 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-300"
          />

          <button
            type="submit"
            title="Send"
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 px-4 py-2.5 transition"
          >
            <Rocket className="h-4 w-4" />
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

/** Group (Spaces) center listing */
const GroupView = ({ group, chats, onSelectChat }) => {
  if (!group)
    return (
      <div className="p-6 text-slate-500">Select a space to view its chats</div>
    );
  return (
    <div className="p-6">
      <h2 className="text-base font-semibold mb-3 text-slate-800 flex items-center gap-2">
        <Folder className="h-4 w-4 text-slate-500" />
        {group.space_name}
      </h2>
      {chats.length === 0 ? (
        <div className="text-slate-500 text-sm">
          No chats yet in this space.
        </div>
      ) : (
        <div className="grid gap-3">
          {chats.map((c) => (
            <button
              key={c._id}
              onClick={() => onSelectChat(c._id)}
              className="text-left bg-white border border-slate-200 rounded-xl shadow hover:shadow-md px-4 py-3 transition"
            >
              <div className="font-medium text-slate-800">{c.title}</div>
              <div className="text-xs text-slate-500 mt-0.5">
                {new Date(c.last_updated).toLocaleString()}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const Navigation = () => {
  const [points, setPoints] = useState(1250);
  const [showPoints, setShowPoints] = useState(false);

  /** chat | group | shop | flashcards | pet */
  const [activeView, setActiveView] = useState("chat");
  const [activeConvoId, setActiveConvoId] = useState(null);
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [showNewDialog, setShowNewDialog] = useState(false);

  // const [groups, setGroups] = useState([
  //   { id: "g-work", name: "Work" },
  //   { id: "g-personal", name: "Personal" },
  // ]);
  const [groups, setGroups] = useState([]);
  useEffect(() => {
    getSpaces().then((spaces) => {
      console.log("Spaces", spaces);
      setGroups(spaces);
    });
  }, []);

  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    getChatsUser().then((chats) => {
      console.log("Chats", chats);
      setConversations(chats);
    });
  }, []);

  /** AbortController per conversation */
  const controllersRef = useRef({});

  const activeConvo = conversations.find((c) => c._id === activeConvoId);
  const activeGroup = groups.find((g) => g._id === activeGroupId);
  const chatsInActiveGroup = conversations.filter(
    (c) => c.space_id === activeGroupId
  );

  /** Recent */
  const recentChats = useMemo(
    () =>
      [...conversations]
        .sort((a, b) => b.last_updated - a.last_updated)
        .slice(0, 5),
    [conversations]
  );

  const viewTitle = useMemo(() => {
    if (activeView === "shop") return "Shop";
    if (activeView === "flashcards") return "Flashcards";
    if (activeView === "pet") return "Pet";
    if (activeView === "group" && activeGroup)
      return `Space: ${activeGroup.name}`;
    return "Chat";
  }, [activeView, activeGroup]);

  /** SSE stream parser (robust; no duplicate tokens) */
  const streamFromApi = async (convoId, text, onToken, opts = {}) => {
    const { signal } = opts;
    const res = await fetch(`${API_BASE}/api/messages/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversation_id: convoId,
        message: text,
        use_chat_endpoint: true,
      }),
      signal,
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    if (!res.body) throw new Error("No response body");

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let idx;
      while ((idx = buffer.search(/\r?\n\r?\n/)) !== -1) {
        const frame = buffer.slice(0, idx);
        buffer = buffer.slice(idx + (buffer[idx] === "\r" ? 4 : 2));
        for (const raw of frame.split(/\r?\n/)) {
          const line = raw.trim();
          if (!line.startsWith("data:")) continue;
          const json = line.slice(5).trim();
          if (!json) continue;
          try {
            const data = JSON.parse(json);
            if (data.token) onToken(data.token);
            if (data.error) throw new Error(data.error);
            if (data.done) return;
          } catch {
            // ignore bad frames
          }
        }
      }
    }

    // Final flush (normally server sends {"done":true})
    decoder.decode();
  };

  /** Send message */
  const handleSend = async (text) => {
    console.log("Handle send", text);
    const idCaptured = activeConvoId;
    const chat_details = await getChatById(idCaptured);
    const space_id = chat_details.space_id;

    console.log("Id captured", idCaptured);
    if (!idCaptured) return;
    setConversations((prev) =>
      prev.map((c) =>
        c._id === idCaptured
          ? { ...c, messages: [...c.messages, { role: "user", content: text }] }
          : c
      )
    );
    chat(idCaptured, text, space_id).then((message) => {
      console.log("Message", message);
      setConversations((prev) =>
        prev.map((c) =>
          c._id === idCaptured
            ? {
                ...c,
                messages: [
                  ...c.messages,
                  { role: "assistant", content: [{text: message}] },
                ],
              }
            : c
        )
      );
    });
    return;

    // // stream tokens
    // try {
    //   await streamFromApi(
    //     idCaptured,
    //     text,
    //     (token) => {
    //       setConversations((prev) =>
    //         prev.map((c) => {
    //           if (c._id !== idCaptured) return c;
    //           const msgs = c.messages.slice();
    //           const last = msgs[msgs.length - 1];
    //           if (last && last.role === "assistant") last.content += token;
    //           return { ...c, messages: msgs, last_updated: Date.now() };
    //         })
    //       );
    //     },
    //     { signal: ctrl.signal }
    //   );
    // } catch (err) {
    //   // fallback content
    //   setConversations((prev) =>
    //     prev.map((c) => {
    //       if (c._id !== idCaptured) return c;
    //       const msgs = c.messages.slice();
    //       const last = msgs[msgs.length - 1];
    //       if (last && last.role === "assistant")
    //         last.content = dummyReply(text);
    //       return { ...c, messages: msgs, last_updated: Date.now() };
    //     })
    //   );
    // } finally {
    //   if (controllersRef.current[idCaptured] === ctrl)
    //     delete controllersRef.current[idCaptured];
    // }
  };

  /** Upload handler — sends to /api/upload (you can implement this on backend) */
  const handleUpload = async (files) => {
    if (!files?.length) return;
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append("files", f, f.name));
      const res = await fetch(`${API_BASE}/api/upload`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error("upload failed");
      // You could show a small system message:
      setConversations((prev) =>
        prev.map((c) =>
          c._id === activeConvoId
            ? {
                ...c,
                messages: [
                  ...c.messages,
                  {
                    role: "assistant",
                    content: `📎 Uploaded ${files.length} file(s) successfully.`,
                  },
                ],
              }
            : c
        )
      );
    } catch (e) {
      setConversations((prev) =>
        prev.map((c) =>
          c._id === activeConvoId
            ? {
                ...c,
                messages: [
                  ...c.messages,
                  { role: "assistant", content: "Upload failed." },
                ],
              }
            : c
        )
      );
    }
  };

  /** Create chat from dialog (and optionally a new group) */
  const handleCreateFromDialog = ({ existingGroupId, newGroupName, title }) => {
    let groupId = existingGroupId;
    if (
      newGroupName &&
      !groups.some(
        (g) => g.space_name.toLowerCase() === newGroupName.toLowerCase()
      )
    ) {
      const newId = "g" + Date.now();
      const newGroup = { id: newId, name: newGroupName };
      setGroups((prev) => [...prev, newGroup]);
      groupId = newId;
    } else if (!groupId && groups[0]) {
      groupId = groups[0]._id;
    }

    const id = "c" + Date.now();
    const chatTitle = title || `New Chat ${id.slice(-4)}`;
    const newChat = {
      id,
      title: chatTitle,
      groupId,
      last_updated: Date.now(),
      messages: [],
    };

    setConversations((prev) => [...prev, newChat]);
    setActiveConvoId(id);
    setActiveGroupId(groupId);
    setActiveView("chat");
  };

  /** Delete chat */
  const handleDeleteChat = (id) => {
    deleteChat(id).then((res) => {
      console.log("Res", res);
      setConversations((prev) => prev.filter((c) => c._id !== id));
      setActiveConvoId((prev) => (prev === id ? null : prev));
    });
    
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-100 text-slate-900">
      <TopBar
        viewTitle={viewTitle}
        points={points}
        onPointsClick={() => setShowPoints(!showPoints)}
      />

      {/* Body */}
      <div className="flex-1 flex">
        {/* Sidebar — light, rounded, subtle shadow */}
        <aside className="w-72 shrink-0 bg-white border-r border-slate-200 shadow-sm flex flex-col overflow-hidden">
          {/* Search + New */}
          <div className="p-3 flex items-center gap-2">
            <div className="relative flex-1">
              <input
                aria-label="Search"
                placeholder="Search…"
                className="w-full rounded-xl bg-white border border-slate-200 shadow-sm placeholder:text-slate-400 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 text-white shadow-md hover:shadow-lg px-3 py-2 text-sm transition"
              onClick={() => setShowNewDialog(true)}
            >
              <Plus className="h-4 w-4" /> New
            </button>
          </div>

          {/* Recent */}
          <SectionTitle>Recent</SectionTitle>
          <div className="px-2 max-h-40 overflow-y-auto">
            {recentChats.map((c) => (
              <button
                key={c._id}
                className={`w-full text-left rounded-lg px-3 py-2 text-sm transition
                  ${
                    activeConvoId === c._id && activeView === "chat"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "hover:bg-slate-100"
                  }`}
                onClick={() => {
                  setActiveConvoId(c._id);
                  setActiveView("chat");
                }}
              >
                {c.title}
              </button>
            ))}
          </div>

          {/* Spaces */}
          <SectionTitle>Spaces</SectionTitle>
          <div className="px-2 overflow-y-auto max-h-48 flex-1">
            {groups.map((g) => (
              <button
                key={g.id}
                className={`w-full text-left rounded-lg px-3 py-2 text-sm transition
                  ${
                    activeGroupId === g._id && activeView === "group"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "hover:bg-slate-100"
                  }`}
                onClick={() => {
                  setActiveGroupId(g._id);
                  setActiveView("group");
                }}
              >
                {g.space_name}
              </button>
            ))}
          </div>

          <Divider />

          <div className="px-2 pb-3 space-y-1">
            <button
              className={`w-full text-left rounded-lg px-3 py-2 text-sm transition hover:bg-slate-100 ${
                activeView === "shop" ? "bg-slate-900 text-white shadow-sm" : ""
              }`}
              onClick={() => setActiveView("shop")}
            >
              <StoreIcon className="inline h-4 w-4 mr-2" /> Shop
            </button>
            <button
              className={`w-full text-left rounded-lg px-3 py-2 text-sm transition hover:bg-slate-100 ${
                activeView === "flashcards"
                  ? "bg-slate-900 text-white shadow-sm"
                  : ""
              }`}
              onClick={() => setActiveView("flashcards")}
            >
              <Brain className="inline h-4 w-4 mr-2" /> Flashcards
            </button>
            <button
              className={`w-full text-left rounded-lg px-3 py-2 text-sm transition hover:bg-slate-100 ${
                activeView === "pet" ? "bg-slate-900 text-white shadow-sm" : ""
              }`}
              onClick={() => setActiveView("pet")}
            >
              <Bird className="inline h-4 w-4 mr-2" /> Pet
            </button>
          </div>
        </aside>

        {/* Center Pane */}
        <main className="flex-1 min-w-0">
          <NewChatDialog
            open={showNewDialog}
            onClose={() => setShowNewDialog(false)}
            groups={groups}
            onCreate={handleCreateFromDialog}
          />

          {activeView === "shop" ? (
            <Store />
          ) : activeView === "flashcards" ? (
            <Flashcard />
          ) : activeView === "pet" ? (
            <Pet points={points} onEarn={(amt) => setPoints((p) => p + amt)} />
          ) : activeView === "group" ? (
            <GroupView
              group={activeGroup}
              chats={chatsInActiveGroup}
              onSelectChat={(id) => {
                setActiveConvoId(id);
                setActiveView("chat");
              }}
            />
          ) : (
            <ChatView
              convo={activeConvo}
              onSend={handleSend}
              onDelete={handleDeleteChat}
              onUpload={handleUpload}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default Navigation;
