// src/Components/Navigation.jsx
import React, { useMemo, useState } from "react";
import Store from "./Store.jsx";
import Flashcard from "./Flashcard.jsx";
import Pet from "./Pet.jsx";
import NewChatDialog from "./NewChatDialog.jsx";

const dummyReply = (text) => {
  if (!text) return "Say something!";
  if (text.toLowerCase().includes("hello"))
    return "Hi there! How can I help today?";
  if (text.toLowerCase().includes("weather"))
    return "It's always sunny in AIVY land ☀️";
  if (text.toLowerCase().includes("bye"))
    return "Goodbye! Come back soon 👋";
  return "This is a dummy AI response. Soon this will be replaced by a real model 🤖.";
};

// ---- helper components ----
const SectionTitle = ({ children, onClick }) => (
  <div
    className="px-3 pt-4 pb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 cursor-pointer select-none"
    onClick={onClick}
  >
    {children}
  </div>
);

const ListItemButton = ({ active, onClick, onContextMenu, children, title, ...rest }) => (
  <button
    type="button"
    onClick={onClick}
    onContextMenu={onContextMenu}
    title={title}
    className={`w-full text-left px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 transition
      ${active ? "bg-neutral-900 text-white" : "hover:bg-neutral-100 dark:hover:bg-neutral-800"}
    `}
    {...rest}
  >
    {children}
  </button>
);

const Divider = () => <div className="my-3 h-px bg-neutral-200 dark:bg-neutral-800" />;

const Coin = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="10" fill="#f5d442" />
    <circle cx="12" cy="12" r="6" fill="#fff2a8" />
    <path d="M12 7v10M7 12h10" stroke="#c9a905" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// ---- top bar ----
const TopBar = ({ viewTitle, points, onPointsClick }) => (
  <header className="h-14 border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-neutral-900/70 dark:border-neutral-800 px-4 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="select-none rounded-md bg-black text-white dark:bg-white dark:text-black px-2 py-1 text-xs font-bold">
        AIVY
      </div>
      <div className="text-sm text-neutral-500">/</div>
      <h1 className="text-sm font-medium">{viewTitle}</h1>
    </div>

    <button
      type="button"
      onClick={onPointsClick}
      aria-label="Open points popover"
      className="flex items-center gap-2 rounded-full px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:outline-none focus:ring-2"
    >
      <Coin />
      <span className="font-semibold tabular-nums">{points.toLocaleString()}</span>
    </button>
  </header>
);

// ---- Chat View ----
const ChatView = ({ convo, onSend, onDelete }) => {
  const [input, setInput] = useState("");

  if (!convo) return <div className="p-6 text-neutral-500">No chat selected</div>;

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-3 border-b flex justify-between items-center dark:border-neutral-800 text-sm text-neutral-600 dark:text-neutral-300">
        <div>{convo.title}</div>
        <button
          onClick={() => onDelete(convo.id)}
          className="text-xs text-red-500 hover:underline"
        >
          Delete Chat
        </button>
      </div>

      <div className="flex-1 overflow-auto px-6 py-6 space-y-4">
        {convo.messages.map((m, idx) => (
          <div
            key={idx}
            className={`max-w-3xl rounded-lg border p-3 whitespace-pre-wrap leading-relaxed text-sm ${
              m.role === "assistant"
                ? "bg-neutral-50 dark:bg-neutral-900/50 border-neutral-200 dark:border-neutral-800"
                : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
            }`}
          >
            {m.content}
          </div>
        ))}
      </div>

      <div className="border-t dark:border-neutral-800 p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSend(input);
            setInput("");
          }}
          className="flex items-center gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label="Message"
            className="flex-1 rounded-md border dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 outline-none focus:ring-2"
            placeholder="Message AIVY…"
          />
          <button
            type="submit"
            className="rounded-md bg-black text-white dark:bg-white dark:text-black px-3 py-2 text-sm"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

// ---- MAIN COMPONENT ----
const Navigation = () => {
  const [points, setPoints] = useState(1250);
  const [showPoints, setShowPoints] = useState(false);
  const [activeView, setActiveView] = useState("chat");
  const [activeConvoId, setActiveConvoId] = useState("c1");
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [spacesOpen, setSpacesOpen] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState({});

  const [groups, setGroups] = useState([
    { id: "g-work", name: "Work" },
    { id: "g-personal", name: "Personal" },
  ]);

  const [conversations, setConversations] = useState(() => [
    {
      id: "c1",
      title: "Brainstorm startup ideas",
      groupId: "g-work",
      updatedAt: Date.now(),
      messages: [
        { role: "user", content: "Give me 5 startup ideas in health." },
        { role: "assistant", content: "1) AI nutrition coach\n2) Sleep ring\n3) Physio app" },
      ],
    },
  ]);

  const activeConvo = conversations.find((c) => c.id === activeConvoId);

  // ---- handle messages ----
  const handleSend = (text) => {
    if (!activeConvoId) return;
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConvoId
          ? {
              ...c,
              updatedAt: Date.now(),
              messages: [
                ...c.messages,
                { role: "user", content: text },
                { role: "assistant", content: dummyReply(text) },
              ],
            }
          : c
      )
    );
  };

  // ---- create from dialog ----
  const handleCreateFromDialog = ({ existingGroupId, newGroupName, title }) => {
    let groupId = existingGroupId;
    if (newGroupName && !groups.some((g) => g.name.toLowerCase() === newGroupName.toLowerCase())) {
      const newId = "g" + Date.now();
      const newGroup = { id: newId, name: newGroupName };
      setGroups((prev) => [...prev, newGroup]);
      groupId = newId;
    } else if (!groupId && groups[0]) groupId = groups[0].id;

    const id = "c" + Date.now();
    const chatTitle = title || `New Chat ${id.slice(-4)}`;
    const newChat = { id, title: chatTitle, groupId, updatedAt: Date.now(), messages: [] };

    setConversations((prev) => [...prev, newChat]);
    setActiveConvoId(id);
    setActiveView("chat");
  };

  const handleDeleteChat = (id) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    setActiveConvoId((prev) => (prev === id ? null : prev));
  };

  const toggleGroup = (id) => {
    setExpandedGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // ---- derived sections ----
  const recentChats = useMemo(
    () => [...conversations].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5),
    [conversations]
  );

  const groupedChats = useMemo(() => {
    const map = {};
    groups.forEach((g) => {
      map[g.id] = conversations.filter((c) => c.groupId === g.id);
    });
    return map;
  }, [groups, conversations]);

  const viewTitle = useMemo(() => {
    if (activeView === "shop") return "Shop";
    if (activeView === "flashcards") return "Flashcards";
    if (activeView === "pet") return "Pet";
    return "Chat";
  }, [activeView]);

  return (
    <div className="h-screen w-screen flex flex-col bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50">
      <TopBar viewTitle={viewTitle} points={points} onPointsClick={() => setShowPoints(!showPoints)} />

      <div className="flex-1 flex">
        {/* SIDEBAR */}
        <aside className="w-72 shrink-0 border-r dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 overflow-hidden flex flex-col">
          {/* search + new */}
          <div className="p-3 flex items-center gap-2">
            <input
              aria-label="Search"
              placeholder="Search…"
              className="flex-1 rounded-md border dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 text-sm outline-none focus:ring-2"
            />
            <button
              type="button"
              className="rounded-md bg-black text-white dark:bg-white dark:text-black px-3 py-2 text-sm"
              onClick={() => setShowNewDialog(true)}
            >
              New
            </button>
          </div>

          {/* recent chats */}
          <SectionTitle>Recent</SectionTitle>
          <div className="px-2 max-h-40 overflow-y-auto">
            {recentChats.map((c) => (
              <ListItemButton
                key={c.id}
                active={activeConvoId === c.id && activeView === "chat"}
                onClick={() => {
                  setActiveConvoId(c.id);
                  setActiveView("chat");
                }}
              >
                {c.title}
              </ListItemButton>
            ))}
          </div>

          {/* spaces */}
          <SectionTitle onClick={() => setSpacesOpen((v) => !v)}>Spaces {spacesOpen ? "▼" : "▶"}</SectionTitle>

          {spacesOpen && (
            <div className="px-2 overflow-y-auto flex-1">
              {groups.map((g) => {
                const chats = groupedChats[g.id] || [];
                const open = expandedGroups[g.id];
                return (
                  <div key={g.id} className="mb-2">
                    <button
                      onClick={() => toggleGroup(g.id)}
                      className="w-full flex items-center justify-between px-2 py-1.5 text-sm rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    >
                      <span className="font-medium">{g.name}</span>
                      <span className="text-xs text-neutral-500">{open ? "−" : "+"}</span>
                    </button>
                    {open && (
                      <div className="mt-1 space-y-1 pl-2">
                        {chats.map((c) => (
                          <ListItemButton
                            key={c.id}
                            active={activeConvoId === c.id && activeView === "chat"}
                            onClick={() => {
                              setActiveConvoId(c.id);
                              setActiveView("chat");
                            }}
                          >
                            {c.title}
                          </ListItemButton>
                        ))}
                        {chats.length === 0 && (
                          <div className="text-xs text-neutral-400 pl-3">No chats</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <Divider />

          {/* footer menu */}
          <div className="px-2 pb-3">
            <ListItemButton active={activeView === "shop"} onClick={() => setActiveView("shop")}>
              🛒 <span className="ml-2">Shop</span>
            </ListItemButton>
            <ListItemButton active={activeView === "flashcards"} onClick={() => setActiveView("flashcards")}>
              🧠 <span className="ml-2">Flashcards</span>
            </ListItemButton>
            <ListItemButton active={activeView === "pet"} onClick={() => setActiveView("pet")}>
              🐣 <span className="ml-2">Pet</span>
            </ListItemButton>
          </div>
        </aside>

        {/* MAIN VIEW */}
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
          ) : (
            <ChatView convo={activeConvo} onSend={handleSend} onDelete={handleDeleteChat} />
          )}
        </main>
      </div>
    </div>
  );
};

export default Navigation;