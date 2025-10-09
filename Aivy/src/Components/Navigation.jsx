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
} from "lucide-react";
import Store from "./Store.jsx";
import Flashcard from "./Flashcard.jsx";
import Pet from "./Pet.jsx";
import NewChatDialog from "./NewChatDialog.jsx";

import {
  getSpaces,
  getChatsUser,
  getChatById,
  deleteChat,
} from "../api/data_api.jsx";
import { chat } from "../api/chat_api.jsx";

const API_BASE = "http://127.0.0.1:8000";

// =============== helpers ===============
const SectionTitle = ({ children, right = null }) => (
  <div className="px-3 pt-4 pb-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text)]/60 select-none flex items-center justify-between">
    <span>{children}</span>
    {right}
  </div>
);

const Divider = () => (
  <div className="my-3 h-px bg-[color:var(--color-border)]/70" />
);

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

/** Top bar */
const TopBar = ({ viewTitle, points, streak, onPointsClick }) => (
  <header className="h-14 border-b border-[color:var(--color-border)] bg-[color:var(--color-panel)]/95 backdrop-blur px-4 flex items-center justify-between shadow-sm">
    <div className="flex items-center gap-3">
      <div className="rounded-lg bg-[color:var(--color-text)] text-[color:var(--color-bg)] px-2 py-1 text-xs font-bold shadow">
        AiVY
      </div>
      <div className="text-sm text-[color:var(--color-text)]/40">/</div>
      <h1 className="text-sm font-semibold text-[color:var(--color-text)]/90">
        {viewTitle}
      </h1>
    </div>

    <div className="flex items-center gap-3">
      <button
        onClick={() => document.documentElement.classList.toggle("dark")}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-panel)] text-[color:var(--color-text)] shadow-sm hover:shadow-md transition"
        title="Toggle theme"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="h-4 w-4"
        >
          <path d="M12 3v1m0 16v1m8.66-9h1M3.34 12h1m14.14 6.36l.7.7M5.82 5.82l.7.7m12.02 0l.7-.7M5.82 18.18l.7-.7" />
        </svg>
        <span className="text-sm font-medium">Theme</span>
      </button>

      <div className="flex items-center gap-1.5 text-sm text-[color:var(--color-text)]/80">
        🔥 <span className="font-semibold">{streak}</span> question streak
      </div>

      <button
        type="button"
        onClick={onPointsClick}
        aria-label="Open points popover"
        className="flex items-center gap-2 rounded-full px-3 py-1.5 hover:bg-[color:var(--color-border)]/30 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-border)] transition"
      >
        <Coin />
        <span className="font-semibold tabular-nums text-[color:var(--color-text)]">
          {points.toLocaleString()}
        </span>
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
        <div className="font-medium text-[color:var(--color-text)]/90">
          {convo.title}
        </div>
        <button
          onClick={() => onDelete(convo._id)}
          className="inline-flex items-center gap-1.5 text-sm text-rose-600 hover:text-rose-700 bg-[color:var(--color-panel)] rounded-md px-2 py-1 border border-[color:var(--color-border)] hover:shadow transition"
          title="Delete chat"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto px-6 py-6 space-y-4">
        {Array.isArray(convo.messages) &&
          convo.messages.map((m, idx) => {
            const isUser = m.role === "user";
            const isAssistant = m.role === "assistant";

            // Be tolerant to shapes: string or [{text}]
            let content = "";
            if (typeof m.content === "string") {
              content = m.content;
            } else if (Array.isArray(m.content) && m.content[0]?.text) {
              content = m.content[0].text;
            } else if (isAssistant && m.content?.text) {
              content = m.content.text;
            } else {
              // Unknown shape → skip
              return null;
            }

            const bubbleClass = isUser
              ? "max-w-[78%] bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)] rounded-2xl rounded-tr-md shadow-md px-4 py-2"
              : "max-w-[78%] bg-[color:var(--color-panel)] border border-[color:var(--color-border)] text-[color:var(--color-text)] rounded-2xl rounded-tl-md shadow px-4 py-2";

            return (
              <div
                key={idx}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div className={bubbleClass}>
                  <ReactMarkdown>{content}</ReactMarkdown>
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

// =============== space view ===============
const SpaceView = ({ space, chats, onSelectChat }) => {
  if (!space)
    return (
      <div className="p-6 opacity-70">Select a space to view its chats</div>
    );
  return (
    <div className="p-6">
      <h2 className="text-base font-semibold mb-3 text-[color:var(--color-text)]/90 flex items-center gap-2">
        <Folder className="h-4 w-4 text-[color:var(--color-text)]/60" />
        {space.space_name}
      </h2>
      {chats.length === 0 ? (
        <div className="opacity-70 text-sm">No chats yet in this space.</div>
      ) : (
        <div className="grid gap-3">
          {chats.map((c) => (
            <button
              key={c._id}
              onClick={() => onSelectChat(c._id)}
              className="text-left bg-[color:var(--color-panel)] border border-[color:var(--color-border)] rounded-xl shadow hover:shadow-md px-4 py-3 transition"
            >
              <div className="font-medium text-[color:var(--color-text)]/90">
                {c.title}
              </div>
              <div className="text-xs opacity-60 mt-0.5">
                {c.last_updated
                  ? new Date(c.last_updated).toLocaleString()
                  : ""}
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

  // views: chat | space | shop | flashcards | pet
  const [activeView, setActiveView] = useState("chat");
  const [activeConvoId, setActiveConvoId] = useState(null);
  const [activeSpaceId, setActiveSpaceId] = useState(null);
  const [showNewDialog, setShowNewDialog] = useState(false);

  // spaces from backend
  const [spaces, setSpaces] = useState([]);
  useEffect(() => {
    getSpaces().then((rows) => {
      setSpaces(Array.isArray(rows) ? rows : []);
      if (!activeSpaceId && rows?.length) setActiveSpaceId(rows[0]._id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // chats (all user chats)
  const [conversations, setConversations] = useState([]);
  useEffect(() => {
    getChatsUser().then((rows) => setConversations(Array.isArray(rows) ? rows : []));
  }, []);

  // (Optional) user info (coins/streak) — keep silent if not found
  
  const userId = "3bqu4jw5Hc5Gs07T";
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `${API_BASE}/users?userId=${encodeURIComponent(userId)}`
        );
        if (!res.ok) return;
        const data = await res.json();
        const user = data?.user;
        if (user) {
          if (user.coins != null) setPoints(user.coins);
          if (user.streak != null) setStreak(user.streak);
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  const activeConvo = conversations.find((c) => c._id === activeConvoId);
  const activeSpace = spaces.find((s) => s._id === activeSpaceId);
  const chatsInActiveSpace = conversations.filter(
    (c) => c.space_id === activeSpaceId
  );

  const recentChats = useMemo(
    () =>
      [...conversations]
        .sort(
          (a, b) =>
            new Date(b.last_updated || 0) - new Date(a.last_updated || 0)
        )
        .slice(0, 5),
    [conversations]
  );

  const viewTitle = useMemo(() => {
    if (activeView === "shop") return "Shop";
    if (activeView === "flashcards") return "Flashcards";
    if (activeView === "pet") return "Pet";
    if (activeView === "space" && activeSpace)
      return `Space: ${activeSpace.space_name}`;
    return "Chat";
  }, [activeView, activeSpace]);

  // ====== chat send via agent API ======
  const handleSend = async (text) => {
    const idCaptured = activeConvoId;
    if (!idCaptured) return;

    // ensure we know its space (used by chat API)
    let space_id = conversations.find((c) => c._id === idCaptured)?.space_id;
    if (!space_id) {
      try {
        const chatDetails = await getChatById(idCaptured);
        space_id = chatDetails?.space_id || space_id;
      } catch {
        // ignore
      }
    }

    // append user message locally
    setConversations((prev) =>
      prev.map((c) =>
        c._id === idCaptured
          ? {
              ...c,
              messages: [...(c.messages || []), { role: "user", content: text }],
            }
          : c
      )
    );

    // ask agent, then append assistant reply
    try {
      const replyText = await chat(idCaptured, text, space_id);
      setConversations((prev) =>
        prev.map((c) =>
          c._id === idCaptured
            ? {
                ...c,
                messages: [
                  ...(c.messages || []),
                  { role: "assistant", content: [{ text: replyText }] },
                ],
                last_updated: new Date().toISOString(),
              }
            : c
        )
      );
    } catch (e) {
      // fallback error inline
      setConversations((prev) =>
        prev.map((c) =>
          c._id === idCaptured
            ? {
                ...c,
                messages: [
                  ...(c.messages || []),
                  {
                    role: "assistant",
                    content:
                      "Sorry, I couldn't reach the chat service. Please try again.",
                  },
                ],
              }
            : c
        )
      );
    }
  };

  // ====== upload placeholder ======
  const handleUpload = async (files) => {
    if (!files?.length) return;
    // Stub UX message only
    setConversations((prev) =>
      prev.map((c) =>
        c._id === activeConvoId
          ? {
              ...c,
              messages: [
                ...(c.messages || []),
                {
                  role: "assistant",
                  content: `📎 Received ${files.length} file(s). (Upload integration TBD)`,
                },
              ],
            }
          : c
      )
    );
  };

  // ====== create from dialog (local add) ======
  const handleCreateFromDialog = ({ existingSpaceId, newSpaceName, title }) => {
    // This handler expects the dialog to pass "spaces" terms.
    let spaceId = existingSpaceId;
    if (!spaceId && spaces[0]) spaceId = spaces[0]._id;

    const id = "c" + Date.now();
    const chatTitle = title || `New Chat ${id.slice(-4)}`;
    const newChat = {
      _id: id,
      title: chatTitle,
      space_id: spaceId || null,
      last_updated: new Date().toISOString(),
      messages: [],
    };

    setConversations((prev) => [newChat, ...prev]);
    setActiveConvoId(id);
    setActiveSpaceId(spaceId || null);
    setActiveView("chat");
  };

  // ====== delete chat ======
  const handleDeleteChat = (id) => {
    deleteChat(id).finally(() => {
      setConversations((prev) => prev.filter((c) => c._id !== id));
      setActiveConvoId((prev) => (prev === id ? null : prev));
    });
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[color:var(--color-bg)] text-[color:var(--color-text)]">
      <TopBar
        viewTitle={viewTitle}
        points={points}
        streak={streak}
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
                className={`w-full text-left rounded-lg px-3 py-2 text-sm transition ${
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

          {/* Spaces */}
          <SectionTitle>Spaces</SectionTitle>
          <div className="px-2 overflow-y-auto max-h-48 flex-1">
            {spaces.map((s) => (
              <button
                key={s._id}
                className={`w-full text-left rounded-lg px-3 py-2 text-sm transition ${
                  activeSpaceId === s._id && activeView === "space"
                    ? "bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)] shadow-md hover:bg-[color:var(--color-accent-weak)]"
                    : "hover:bg-[color:var(--color-accent-weak)] hover:text-[color:var(--color-on-accent)] hover:shadow-sm"
                }`}
                onClick={() => {
                  setActiveSpaceId(s._id);
                  setActiveView("space");
                }}
              >
                {s.space_name}
              </button>
            ))}
            {spaces.length === 0 && (
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
            // pass spaces to dialog as {id, name}
            groups={spaces.map((s) => ({ id: s._id, name: s.space_name }))}
            // NOTE: dialog still uses "groups" prop name, but we treat them as spaces.
            onCreate={({ existingGroupId, newGroupName, title }) =>
              handleCreateFromDialog({
                existingSpaceId: existingGroupId,
                newSpaceName: newGroupName,
                title,
              })
            }
          />

          {activeView === "shop" ? (
            <Store setPoints={setPoints} />
          ) : activeView === "flashcards" ? (
            <Flashcard setPoints={setPoints} setStreak={setStreak} />
          ) : activeView === "pet" ? (
            <Pet points={points} onEarn={(amt) => setPoints((p) => p + amt)} />
          ) : activeView === "space" ? (
            <SpaceView
              space={activeSpace}
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