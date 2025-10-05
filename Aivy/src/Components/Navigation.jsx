// src/Components/Navigation.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  Paperclip,
  Rocket,
  Plus,
  Trash2,
  Folder,
  Store as StoreIcon,
  Brain,
  Bird,
  Pencil,
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

const API_BASE = "http://127.0.0.1:8000";

// -------- configuration you can later replace with real auth --------
const DEMO_USER_ID = "demo-user-1"; // TODO: replace with your real signed-in user id

// =============== helpers ===============
const SectionTitle = ({ children, right = null }) => (
  <div className="px-3 pt-4 pb-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text)]/60 select-none flex items-center justify-between">
    <span>{children}</span>
    {right}
  </div>
);

const Divider = () => <div className="my-3 h-px bg-[color:var(--color-border)]/70" />;

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
const TopBar = ({ viewTitle, points, streak, onPointsClick }) => (
  <header className="h-14 border-b border-[color:var(--color-border)] bg-[color:var(--color-panel)]/95 backdrop-blur px-4 flex items-center justify-between shadow-sm">
    <div className="flex items-center gap-3">
      <div className="rounded-lg bg-[color:var(--color-text)] text-[color:var(--color-bg)] px-2 py-1 text-xs font-bold shadow">
        AIVY
      </div>
      <div className="text-sm text-[color:var(--color-text)]/40">/</div>
      <h1 className="text-sm font-semibold text-[color:var(--color-text)]/90">{viewTitle}</h1>
    </div>

    <div className="flex items-center gap-2">
      <button
        onClick={() => document.documentElement.classList.toggle("dark")}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-panel)] text-[color:var(--color-text)] shadow-sm hover:shadow-md transition"
        title="Toggle theme"
      >
        {/* simple icon */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
          <path d="M12 3v1m0 16v1m8.66-9h1M3.34 12h1m14.14 6.36l.7.7M5.82 5.82l.7.7m12.02 0l.7-.7M5.82 18.18l.7-.7" />
        </svg>
        <span className="text-sm font-medium">Theme</span>
      </button>
      <div className="flex items-center gap-2 text-sm text-slate-700">
        🔥 <span className="font-semibold">{streak}</span> question streak
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
    </div>
  </header>
);


/** Chat view with bubbles + 3D-ish inputs/buttons */
// =============== chat view ===============
const ChatView = ({ convo, onSend, onDelete, onUpload }) => {
  const [input, setInput] = useState("");
  const fileRef = useRef(null);
  console.log("Convo", convo);

  if (!convo) return <div className="p-6 opacity-70">No chat selected</div>;

  return (
    <div className="h-full flex flex-col">
      {/* Title */}
      <div className="px-6 py-3 border-b border-[color:var(--color-border)] text-sm flex items-center justify-between bg-[color:var(--color-panel)]">
        <div className="font-medium text-[color:var(--color-text)]/90">{convo.title}</div>
        <button
          onClick={() => onDelete(convo.id)}
          className="inline-flex items-center gap-1.5 text-sm text-rose-600 hover:text-rose-700 bg-[color:var(--color-panel)] rounded-md px-2 py-1 border border-[color:var(--color-border)] hover:shadow transition"
          title="Delete chat"
        >
          <Trash2 className="h-4 w-4" />
          Delete
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
//           return (
//             toRender && (
//               <div
//                 key={idx}
//                 className={`flex ${isUser ? "justify-end" : "justify-start"}`}
//               >
//                 <div
//                   className={
//                     isUser
//                       ? "max-w-[78%] bg-blue-600 text-white rounded-2xl rounded-tr-md shadow-md px-4 py-2"
//                       : "max-w-[78%] bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-tl-md shadow px-4 py-2"
//                   }
//                 >
//                   {content}
//                 </div>
          const bubbleClass = isUser
            ? "max-w-[78%] bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)] rounded-2xl rounded-tr-md shadow-md px-4 py-2"
            : "max-w-[78%] bg-[color:var(--color-panel)] border border-[color:var(--color-border)] text-[color:var(--color-text)] rounded-2xl rounded-tl-md shadow px-4 py-2";
          return (
            <div key={idx} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
              <div className={bubbleClass}>
                {/* render markdown safely */}
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            )
          );
        })}
      </div>

      {/* Composer */}
      <div className="border-t border-[color:var(--color-border)] p-3 bg-[color:var(--color-panel)]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const text = input.trim();
            if (!text) return;
            onSend(text);
            setInput("");
          }}
          className="flex items-center gap-2 bg-[color:var(--color-panel)] border border-[color:var(--color-border)] rounded-2xl px-3 py-2 shadow-sm"
        >
          <button
            type="button"
            title="Attach files"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center justify-center rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-panel)] shadow-sm hover:bg-[color:var(--color-accent-weak)] hover:text-[color:var(--color-on-accent)] hover:shadow-md px-3 py-2 transition"
          >
            <Paperclip className="h-5 w-5" />
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
            className="flex-1 rounded-xl bg-[color:var(--color-panel)] border border-[color:var(--color-border)] shadow-sm placeholder:text-[color:var(--color-text)]/40 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[--color-accent]"
          />

          <button
            type="submit"
            className="flex items-center gap-2 rounded-xl bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)] px-4 py-2 shadow-sm hover:bg-[color:var(--color-accent-weak)] hover:shadow-md active:scale-[0.98] transition"
          >
            <Rocket className="h-4 w-4" />
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

// =============== group/space view ===============
const GroupView = ({ group, chats, onSelectChat }) => {
  if (!group)
    return (
      <div className="p-6 opacity-70">Select a space to view its chats</div>
    );
  return (
    <div className="p-6">
      <h2 className="text-base font-semibold mb-3 text-[color:var(--color-text)]/90 flex items-center gap-2">
        <Folder className="h-4 w-4 text-[color:var(--color-text)]/60" />
        {group.space_name}
      </h2>
      {chats.length === 0 ? (
        <div className="opacity-70 text-sm">No chats yet in this space.</div>
      ) : (
        <div className="grid gap-3">
          {chats.map((c) => (
            <button
              key={c._id}
              onClick={() => onSelectChat(c._id)}
              cclassName="text-left bg-[color:var(--color-panel)] border border-[color:var(--color-border)] rounded-xl shadow hover:shadow-md px-4 py-3 transition"
            >
              <div className="font-medium text-[color:var(--color-text)]/90">{c.title}</div>
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

// =============== main ===============
const Navigation = () => {
  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showPoints, setShowPoints] = useState(false);

  // views: chat | group | shop | flashcards | pet
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
  const userId = "68e1f7697d8c1deff631e9ba";

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/users?userId=${encodeURIComponent(userId)}`
        );
        if (!res.ok) {
          console.warn(`Failed to fetch user: ${res.status}`);
          return;
        }

        const data = await res.json();
        const user = data?.user;
        if (user) {
          if (user.coins != null) setPoints(user.coins);
          if (user.streak != null) setStreak(user.streak);
        } else {
          console.warn("No user field in response", data);
        }
      } catch (err) {
        console.error("Failed to fetch user data:", err);
      }
    };

    fetchUserData();
  }, []); // runs once on mount

  // for streaming
  const controllersRef = useRef({});

  const activeConvo = conversations.find((c) => c._id === activeConvoId);
  const activeGroup = groups.find((g) => g._id === activeGroupId);
  const chatsInActiveGroup = conversations.filter(
    (c) => c.space_id === activeGroupId
  );

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
  }, [activeView, activeSpace]);

  // ====== SPACES: backend integration ======
  const fetchSpaces = async () => {
    setLoadingSpaces(true);
    try {
      const res = await fetch(`${API_BASE}/spaces/user/${encodeURIComponent(DEMO_USER_ID)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const list = await res.json(); // [{ _id, user_id, project_name }, ...]
      setSpaces(Array.isArray(list) ? list : []);
      // auto-pick first if none selected
      if (!activeSpaceId && list.length) setActiveSpaceId(list[0]._id);
    } catch (e) {
      console.error("Failed to load spaces:", e);
    } finally {
      setLoadingSpaces(false);
    }
  };

  const createSpace = async () => {
    const name = window.prompt("New space name?");
    if (!name) return;
    try {
      const res = await fetch(`${API_BASE}/spaces`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: DEMO_USER_ID, project_name: name }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`HTTP ${res.status}: ${t}`);
      }
      await fetchSpaces();
    } catch (e) {
      alert(`Create failed: ${e.message}`);
    }
  };

  const renameSpace = async (id) => {
    const current = spaces.find((s) => s._id === id);
    const next = window.prompt("Rename space to…", current?.project_name || "");
    if (!next || next === current?.project_name) return;
    try {
      const res = await fetch(`${API_BASE}/spaces/${encodeURIComponent(id)}?project_name=${encodeURIComponent(next)}`, {
        method: "PUT",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await fetchSpaces();
    } catch (e) {
      alert(`Rename failed: ${e.message}`);
    }
  };

  const deleteSpace = async (id) => {
    if (!window.confirm("Delete this space?")) return;
    try {
      const res = await fetch(`${API_BASE}/spaces/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await fetchSpaces();
      if (activeSpaceId === id) setActiveSpaceId(null);
    } catch (e) {
      alert(`Delete failed: ${e.message}`);
    }
  };

  useEffect(() => {
    fetchSpaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ====== SSE: robust parser + dedupe ======
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
    let lastToken = null;

    const push = (tok) => {
      if (!tok) return;
      if (tok === lastToken) return; // de-dupe 1: skip exact repeat
      lastToken = tok;
      onToken(tok);
    };

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
            if (data.token) push(data.token);
            if (data.error) throw new Error(data.error);
            if (data.done) return;
          } catch {
            // ignore bad frames
          }
        }
      }
    }
    decoder.decode();
  };

  // ====== chat send ======
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

  // ====== upload -> /documents ======
  // Sends each file with user_id, project_id (activeSpaceId), chat_id (activeConvoId)
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

    // small inline confirmation
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConvoId
          ? {
              ...c,
              messages: [
                ...c.messages,
                {
                  role: "assistant",
                  content:
                    results.length === 1
                      ? (results[0].ok
                          ? `📎 **${results[0].name}** uploaded. (id: \`${results[0].id}\`)`
                          : `⚠️ Upload failed for **${results[0].name}**: ${results[0].err}`)
                      : [
                          `📎 Uploaded ${results.filter(r => r.ok).length}/${results.length} file(s):`,
                          ...results.map(r =>
                            r.ok
                              ? `- **${r.name}** ✅ (\`${r.id}\`)`
                              : `- **${r.name}** ❌ ${r.err}`
                          )
                        ].join("\n"),
                },
              ],
            }
          : c
      )
    );
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
    setActiveSpaceId(spaceId || null);
    setActiveView("chat");
  };

  // ====== delete chat (local only demo) ======
  const handleDeleteChat = (id) => {
    deleteChat(id).then((res) => {
      console.log("Res", res);
      setConversations((prev) => prev.filter((c) => c._id !== id));
      setActiveConvoId((prev) => (prev === id ? null : prev));
    });
    
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[color:var(--color-bg)] text-[color:var(--color-text)]">
      <TopBar
        viewTitle={viewTitle}
        points={points}
        onPointsClick={() => setShowPoints(!showPoints)}
      />

      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside className="w-72 shrink-0 bg-[color:var(--color-panel)] border-r border-[color:var(--color-border)] shadow-sm flex flex-col overflow-hidden">
          {/* Search + New Chat */}
          <div className="p-3 flex items-center gap-2">
            <div className="relative flex-1">
              <input
                aria-label="Search"
                placeholder="Search…"
                className="w-full rounded-xl bg-[color:var(--color-panel)] border border-[color:var(--color-border)] shadow-sm placeholder:text-[color:var(--color-text)]/40 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[--color-accent]"
              />
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)] shadow-md hover:shadow-lg hover:bg-[color:var(--color-accent-weak)] active:bg-[color:var(--color-accent-strong)] px-3 py-2 text-sm transition"
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
                      ? "bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)] shadow-md hover:bg-[color:var(--color-accent-weak)]"
                          : "hover:bg-[color:var(--color-accent-weak)] hover:text-[color:var(--color-on-accent)] hover:shadow-sm"
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

          {/* Spaces header with CRUD */}
          <SectionTitle
            right={
              <div className="flex items-center gap-1 pr-1">
                <button
                  className="p-1 rounded-md border border-[color:var(--color-border)] hover:bg-[color:var(--color-accent-weak)] hover:text-[color:var(--color-on-accent)]"
                  title="New space"
                  onClick={createSpace}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>

                {activeSpaceId ? (
                  <>
                    <button
                      className="p-1 rounded-md border border-[color:var(--color-border)] hover:bg-[color:var(--color-accent-weak)] hover:text-[color:var(--color-on-accent)]"
                      title="Rename space"
                      onClick={() => renameSpace(activeSpaceId)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      className="p-1 rounded-md border border-[color:var(--color-border)] hover:bg-[color:var(--color-accent-weak)] hover:text-[color:var(--color-on-accent)]"
                      title="Delete space"
                      onClick={() => deleteSpace(activeSpaceId)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : null}
              </div>
            }
          >
            Spaces {loadingSpaces ? <span className="opacity-60">(loading…)</span> : null}
          </SectionTitle>

          {/* Spaces list (from backend) */}
          <div className="px-2 overflow-y-auto max-h-48 flex-1">
            {groups.map((g) => (
              <button
                key={g.id}
                className={`w-full text-left rounded-lg px-3 py-2 text-sm transition
                  ${
                    activeGroupId === g._id && activeView === "group"
                      ? "bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)] shadow-md hover:bg-[color:var(--color-accent-weak)]"
                        : "hover:bg-[color:var(--color-accent-weak)] hover:text-[color:var(--color-on-accent)] hover:shadow-sm"
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

          {/* Nav buttons */}
          <div className="px-2 pb-3 space-y-1">
            <button
              className={`w-full text-left rounded-lg px-3 py-2 text-sm transition ${
                activeView === "shop"
                  ? "bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)] shadow-md hover:bg-[color:var(--color-accent-weak)]"
                  : "hover:bg-[color:var(--color-accent-weak)] hover:text-[color:var(--color-on-accent)] hover:shadow-sm"
              }`}
              onClick={() => setActiveView("shop")}
            >
              <StoreIcon className="inline h-4 w-4 mr-2" /> Shop
            </button>
            <button
              className={`w-full text-left rounded-lg px-3 py-2 text-sm transition ${
                activeView === "flashcards"
                  ? "bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)] shadow-md hover:bg-[color:var(--color-accent-weak)]"
                  : "hover:bg-[color:var(--color-accent-weak)] hover:text-[color:var(--color-on-accent)] hover:shadow-sm"
              }`}
              onClick={() => setActiveView("flashcards")}
            >
              <Brain className="inline h-4 w-4 mr-2" /> Flashcards
            </button>
            <button
              className={`w-full text-left rounded-lg px-3 py-2 text-sm transition ${
                activeView === "pet"
                  ? "bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)] shadow-md hover:bg-[color:var(--color-accent-weak)]"
                  : "hover:bg-[color:var(--color-accent-weak)] hover:text-[color:var(--color-on-accent)] hover:shadow-sm"
              }`}
              onClick={() => setActiveView("pet")}
            >
              <Bird className="inline h-4 w-4 mr-2" /> Pet
            </button>
          </div>
        </aside>

        {/* Main pane */}
        <main className="flex-1 min-w-0">
          <NewChatDialog
            open={showNewDialog}
            onClose={() => setShowNewDialog(false)}
            // Map backend spaces to {id, name} for the dialog
            groups={spaces.map((s) => ({ id: s._id, name: s.project_name }))}
            onCreate={handleCreateFromDialog}
          />

          {activeView === "shop" ? (
            <Store setPoints={setPoints} />
          ) : activeView === "flashcards" ? (
            <Flashcard setPoints={setPoints} setStreak={setStreak}/>
          ) : activeView === "pet" ? (
            <Pet points={points} onEarn={(amt) => setPoints((p) => p + amt)} />
          ) : activeView === "group" ? (
            <GroupView
              group={activeSpace}
              chats={chatsInActiveSpace}
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
