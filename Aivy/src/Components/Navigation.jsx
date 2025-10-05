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

const API_BASE = "http://127.0.0.1:8787";

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
    <path d="M12 7v10M7 12h10" stroke="#c9a905" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const dummyReply = (text) => {
  if (!text) return "Say something!";
  const t = text.toLowerCase();
  if (t.includes("hello")) return "Hi there! How can I help today?";
  if (t.includes("weather")) return "It’s always sunny in AIVY land ☀️";
  if (t.includes("bye")) return "Goodbye! Come back soon 👋";
  return "This is a dummy AI response. Soon this will be replaced by a real model 🤖.";
};

// =============== top bar ===============
const TopBar = ({ viewTitle, points, onPointsClick }) => (
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

      <button
        type="button"
        onClick={onPointsClick}
        aria-label="Open points"
        className="flex items-center gap-2 rounded-full px-3 py-1.5 border border-[color:var(--color-border)] bg-[color:var(--color-panel)] text-[color:var(--color-text)] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[--color-accent] transition"
      >
        <Coin />
        <span className="font-semibold tabular-nums">{points.toLocaleString()}</span>
      </button>
    </div>
  </header>
);

// =============== chat view ===============
const ChatView = ({ convo, onSend, onDelete, onUpload }) => {
  const [input, setInput] = useState("");
  const fileRef = useRef(null);

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
          const bubbleClass = isUser
            ? "max-w-[78%] bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)] rounded-2xl rounded-tr-md shadow-md px-4 py-2"
            : "max-w-[78%] bg-[color:var(--color-panel)] border border-[color:var(--color-border)] text-[color:var(--color-text)] rounded-2xl rounded-tl-md shadow px-4 py-2";
          return (
            <div key={idx} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
              <div className={bubbleClass}>
                {/* render markdown safely */}
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>
            </div>
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
  if (!group) return <div className="p-6 opacity-70">Select a space to view its chats</div>;
  return (
    <div className="p-6">
      <h2 className="text-base font-semibold mb-3 text-[color:var(--color-text)]/90 flex items-center gap-2">
        <Folder className="h-4 w-4 text-[color:var(--color-text)]/60" />
        {group.project_name || group.name}
      </h2>
      {chats.length === 0 ? (
        <div className="opacity-70 text-sm">No chats yet in this space.</div>
      ) : (
        <div className="grid gap-3">
          {chats.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelectChat(c.id)}
              className="text-left bg-[color:var(--color-panel)] border border-[color:var(--color-border)] rounded-xl shadow hover:shadow-md px-4 py-3 transition"
            >
              <div className="font-medium text-[color:var(--color-text)]/90">{c.title}</div>
              <div className="text-xs opacity-60 mt-0.5">{new Date(c.updatedAt).toLocaleString()}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// =============== main ===============
const Navigation = () => {
  const [points, setPoints] = useState(1250);
  const [showPoints, setShowPoints] = useState(false);

  // views: chat | group | shop | flashcards | pet
  const [activeView, setActiveView] = useState("chat");
  const [activeConvoId, setActiveConvoId] = useState("c1");
  const [activeSpaceId, setActiveSpaceId] = useState(null); // backend space _id
  const [showNewDialog, setShowNewDialog] = useState(false);

  // backend spaces (projects)
  const [spaces, setSpaces] = useState([]); // [{_id, user_id, project_name}, ...]
  const [loadingSpaces, setLoadingSpaces] = useState(false);

  // local conversations demo
  const [conversations, setConversations] = useState(() => [
    {
      id: "c1",
      title: "Brainstorm startup ideas",
      space_id: null, // can associate with activeSpaceId when created
      updatedAt: Date.now(),
      messages: [
        { role: "user", content: "Give me **5 startup ideas** in health." },
        { role: "assistant", content: "1) AI nutrition coach\n2) Sleep ring\n3) Physio app" },
      ],
    },
  ]);

  // for streaming
  const controllersRef = useRef({});

  const activeConvo = conversations.find((c) => c.id === activeConvoId);
  const activeSpace = spaces.find((s) => s._id === activeSpaceId);
  const chatsInActiveSpace = conversations.filter((c) => c.space_id === activeSpaceId);

  const recentChats = useMemo(
    () => [...conversations].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5),
    [conversations]
  );

  const viewTitle = useMemo(() => {
    if (activeView === "shop") return "Shop";
    if (activeView === "flashcards") return "Flashcards";
    if (activeView === "pet") return "Pet";
    if (activeView === "group" && activeSpace) return `Space: ${activeSpace.project_name}`;
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
    const idCaptured = activeConvoId;
    if (!idCaptured) return;

    // cancel existing stream for this chat
    if (controllersRef.current[idCaptured]) controllersRef.current[idCaptured].abort();
    const ctrl = new AbortController();
    controllersRef.current[idCaptured] = ctrl;

    // ensure conversation is associated to active space (project)
    setConversations((prev) =>
      prev.map((c) =>
        c.id === idCaptured
          ? {
              ...c,
              space_id: c.space_id ?? activeSpaceId ?? null,
              updatedAt: Date.now(),
              messages: [...c.messages, { role: "user", content: text }, { role: "assistant", content: "" }],
            }
          : c
      )
    );

    try {
      await streamFromApi(
        idCaptured,
        text,
        (token) => {
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id !== idCaptured) return c;
              const msgs = c.messages.slice();
              const last = msgs[msgs.length - 1];
              if (last && last.role === "assistant") {
                // De-dupe 2: avoid "…word" + same "word" again because of accidental token repeat
                const prevTail = last.content.slice(-token.length);
                if (prevTail !== token) last.content += token;
              }
              return { ...c, messages: msgs, updatedAt: Date.now() };
            })
          );
        },
        { signal: ctrl.signal }
      );
    } catch {
      // fallback content
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== idCaptured) return c;
          const msgs = c.messages.slice();
          const last = msgs[msgs.length - 1];
          if (last && last.role === "assistant") last.content = dummyReply(text);
          return { ...c, messages: msgs, updatedAt: Date.now() };
        })
      );
    } finally {
      if (controllersRef.current[idCaptured] === ctrl) delete controllersRef.current[idCaptured];
    }
  };

  // ====== upload -> /documents ======
  // Sends each file with user_id, project_id (activeSpaceId), chat_id (activeConvoId)
  const handleUpload = async (files) => {
    if (!files?.length) return;
    const results = [];
    for (const f of files) {
      try {
        const fd = new FormData();
        fd.append("user_id", DEMO_USER_ID);
        if (activeSpaceId) fd.append("project_id", activeSpaceId);
        if (activeConvoId) fd.append("chat_id", activeConvoId);
        fd.append("file", f, f.name);

        const res = await fetch(`${API_BASE}/documents`, { method: "POST", body: fd });
        if (!res.ok) throw new Error(`upload failed: ${res.status}`);
        const data = await res.json();
        results.push({ ok: true, id: data.document_id, name: f.name });
      } catch (e) {
        results.push({ ok: false, name: f.name, err: e.message });
      }
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

  // ====== create chat from dialog (and optionally new backend space) ======
  const handleCreateFromDialog = async ({ existingGroupId, newGroupName, title }) => {
    let spaceId = existingGroupId; // expecting a backend space _id
    // If user typed a new space name -> create it on backend
    if (newGroupName && !spaces.some((s) => s.project_name.toLowerCase() === newGroupName.toLowerCase())) {
      try {
        const res = await fetch(`${API_BASE}/spaces`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: DEMO_USER_ID, project_name: newGroupName }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        await fetchSpaces();
        // reload spaces, pick the one with newGroupName
        const created = spaces.find((s) => s.project_name.toLowerCase() === newGroupName.toLowerCase());
        spaceId = created?._id || spaceId;
      } catch (e) {
        console.error("Failed creating space:", e);
      }
    } else if (!spaceId && spaces[0]) {
      spaceId = spaces[0]._id;
    }

    const id = "c" + Date.now();
    const chatTitle = title || `New Chat ${id.slice(-4)}`;
    const newChat = { id, title: chatTitle, space_id: spaceId || null, updatedAt: Date.now(), messages: [] };

    setConversations((prev) => [...prev, newChat]);
    setActiveConvoId(id);
    setActiveSpaceId(spaceId || null);
    setActiveView("chat");
  };

  // ====== delete chat (local only demo) ======
  const handleDeleteChat = (id) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    setActiveConvoId((prev) => (prev === id ? null : prev));
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[color:var(--color-bg)] text-[color:var(--color-text)]">
      <TopBar viewTitle={viewTitle} points={points} onPointsClick={() => setShowPoints(!showPoints)} />

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
            {conversations
              .slice()
              .sort((a, b) => b.updatedAt - a.updatedAt)
              .slice(0, 5)
              .map((c) => {
                const active = activeConvoId === c.id && activeView === "chat";
                return (
                  <button
                    key={c.id}
                    className={`w-full text-left rounded-lg px-3 py-2 text-sm transition
                      ${
                        active
                          ? "bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)] shadow-md hover:bg-[color:var(--color-accent-weak)]"
                          : "hover:bg-[color:var(--color-accent-weak)] hover:text-[color:var(--color-on-accent)] hover:shadow-sm"
                      }`}
                    onClick={() => {
                      setActiveConvoId(c.id);
                      setActiveView("chat");
                    }}
                  >
                    {c.title}
                  </button>
                );
              })}
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
            {spaces.map((s) => {
              const active = activeSpaceId === s._id && activeView === "group";
              return (
                <button
                  key={s._id}
                  className={`w-full text-left rounded-lg px-3 py-2 text-sm transition
                    ${
                      active
                        ? "bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)] shadow-md hover:bg-[color:var(--color-accent-weak)]"
                        : "hover:bg-[color:var(--color-accent-weak)] hover:text-[color:var(--color-on-accent)] hover:shadow-sm"
                    }`}
                  onClick={() => {
                    setActiveSpaceId(s._id);
                    setActiveView("group");
                  }}
                >
                  {s.project_name}
                </button>
              );
            })}
            {spaces.length === 0 && !loadingSpaces && (
              <div className="px-3 py-2 text-sm opacity-70">No spaces yet.</div>
            )}
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
            <Store />
          ) : activeView === "flashcards" ? (
            <Flashcard
              // pass spaces so Flashcards can show All/Work/Personal etc. if you want
              groups={spaces.map((s) => ({ id: s._id, name: s.project_name }))}
              onEarn={(delta) => setPoints((p) => p + delta)}
            />
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