// src/Components/Navigation.jsx
import React, { useMemo, useRef, useState } from "react";
import Store from "./Store.jsx";
import Flashcard from "./Flashcard.jsx";
import Pet from "./Pet.jsx";
import NewChatDialog from "./NewChatDialog.jsx";
import UploadButton from "./UploadButton.jsx";

const API_BASE = "http://127.0.0.1:8787";

/* -------------------------- Small UI primitives -------------------------- */
const SectionTitle = ({ children }) => (
  <div className="px-3 pt-4 pb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 select-none">
    {children}
  </div>
);

const ListItemButton = ({ active, onClick, children, title }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={`w-full text-left px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 transition
      ${active ? "bg-neutral-900 text-white" : "hover:bg-neutral-100 dark:hover:bg-neutral-800"}
    `}
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

/* ------------------------------ Chat View UI ----------------------------- */
const ChatView = ({ convo, onSend, onDelete, onUploaded, apiBase }) => {
  const [input, setInput] = useState("");

  if (!convo) return <div className="p-6 text-neutral-500">No chat selected</div>;

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-3 border-b flex justify-between items-center dark:border-neutral-800 text-sm text-neutral-600 dark:text-neutral-300">
        <div className="truncate">{convo.title}</div>
        <button onClick={() => onDelete(convo.id)} className="text-xs text-red-500 hover:underline">
          Delete Chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto px-6 py-6 space-y-4">
        {convo.messages.map((m, idx) => {
          const isUser = m.role === "user";
          return (
            <div key={idx} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-xl border px-4 py-2 text-sm whitespace-pre-wrap leading-relaxed shadow-sm
                  ${
                    isUser
                      ? "bg-blue-500 text-white border-blue-500 self-end"
                      : "bg-neutral-50 dark:bg-neutral-900/50 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100"
                  }`}
              >
                {m.content}
              </div>
            </div>
          );
        })}
      </div>

      {/* Composer */}
      <div className="border-t dark:border-neutral-800 p-3">
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
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label="Message"
            className="flex-1 rounded-md border dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 outline-none focus:ring-2"
            placeholder="Message AIVY…"
          />
           {/* Attach button */}
          <UploadButton
            apiBase={apiBase}
            conversationId={convo.id}
            onUploaded={onUploaded}
          />
          <button type="submit" className="rounded-md bg-black text-white dark:bg-white dark:text-black px-3 py-2 text-sm">
            Send
          </button>
        </form>
      </div>

      {/* Attachments preview */}
      {(convo.uploads && convo.uploads.length > 0) && (
        <div className="px-6 pb-2 text-xs text-neutral-600 dark:text-neutral-300">
          <div className="mb-1 font-medium">Attachments</div>
          <ul className="flex flex-wrap gap-2">
            {convo.uploads.map((f) => (
              <li key={f.id} className="border rounded px-2 py-1 bg-neutral-50 dark:bg-neutral-900/40">
                <span className="mr-2">📄</span>
                <span title={f.filename}>{f.filename}</span>
                <span className="ml-2 text-neutral-400">({Math.round((f.size || 0)/1024)} KB)</span>
              </li>
            ))}
          </ul>
        </div>
      )}

    </div>
  );
};

/* ---------------------------- Group (Spaces) UI --------------------------- */
const GroupView = ({ group, chats, onSelectChat }) => {
  if (!group) return <div className="p-6 text-neutral-500">Select a space to view its chats</div>;
  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-3">{group.name}</h2>
      {chats.length === 0 ? (
        <div className="text-neutral-500 text-sm">No chats yet in this space.</div>
      ) : (
        <div className="grid gap-2">
          {chats.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelectChat(c.id)}
              className="text-left border rounded-lg px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <div className="font-medium">{c.title}</div>
              <div className="text-xs text-neutral-500">{new Date(c.updatedAt).toLocaleString()}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ----------------------------- Overlap helper ---------------------------- */
/** Append token to base while removing any overlap to avoid "HowHow" etc. */
function appendWithOverlap(base, token) {
  if (!token) return base;
  if (base.endsWith(token)) return base; // exact duplicate
  const max = Math.min(base.length, token.length);
  let k = max;
  while (k > 0 && base.slice(-k) !== token.slice(0, k)) k--;
  return base + token.slice(k);
}

/* ------------------------------- Main Shell ------------------------------ */
const Navigation = () => {
  const [points, setPoints] = useState(1250);
  const [showPoints, setShowPoints] = useState(false);
  const [activeView, setActiveView] = useState("chat"); // chat | shop | pet | flashcards | group
  const [activeConvoId, setActiveConvoId] = useState("c1");
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [showNewDialog, setShowNewDialog] = useState(false);

  // Streams registry: one entry per conversation { controller, reqId, lastTokenNorm }
  const streamsRef = useRef(
    /** @type {Record<string, { controller: AbortController, reqId: number, lastTokenNorm?: string }>} */ ({})
  );

  // Groups / Spaces
  const [groups, setGroups] = useState([
    { id: "g-work", name: "Work" },
    { id: "g-personal", name: "Personal" },
  ]);

  // Seed with a welcome assistant message
  const [conversations, setConversations] = useState(() => [
    {
      id: "c1",
      title: "Welcome",
      groupId: "g-work",
      updatedAt: Date.now(),
      messages: [
        {
          role: "assistant",
          content:
            "Hey! I’m AIVY — wired to your local Ollama. Ask me anything to get started.",
        },
      ],
      uploads: [],  // <-- add this
    },
  ]);

  

  const activeConvo = conversations.find((c) => c.id === activeConvoId);
  const activeGroup = groups.find((g) => g.id === activeGroupId);
  const chatsInActiveGroup = conversations.filter((c) => c.groupId === activeGroupId);

  /* ------------------------- Robust SSE stream parser ------------------------- */
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

    if (!res.ok) {
      const t = await res.text();
      console.error("Stream HTTP error:", res.status, t);
      throw new Error(`HTTP ${res.status}`);
    }
    if (!res.body) {
      console.error("No response body (ReadableStream missing)");
      throw new Error("No response body");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let sepIndex;
      while ((sepIndex = buffer.indexOf("\n\n")) !== -1 || (sepIndex = buffer.indexOf("\r\n\r\n")) !== -1) {
        const isCRLF = buffer[sepIndex] === "\r";
        const frame = buffer.slice(0, sepIndex);
        buffer = buffer.slice(sepIndex + (isCRLF ? 4 : 2));

        for (const rawLine of frame.split(/\r?\n/)) {
          const line = rawLine.trim();
          if (!line.startsWith("data:")) continue;

          const json = line.slice(5).trim();
          if (!json) continue;

          try {
            const data = JSON.parse(json);
            if (data.token) onToken(data.token);
            if (data.error) throw new Error(data.error);
            if (data.done) return;
          } catch (e) {
            console.warn("Bad SSE data:", json);
          }
        }
      }
    }

    const tail = decoder.decode();
    if (tail) buffer += tail;
  };

  /* ---------------------- Send flow with de-dupe + cancel --------------------- */
  const handleSend = async (text) => {
    const convoId = activeConvoId;
    if (!convoId) return;

    // Abort any previous stream for this convo
    const prev = streamsRef.current[convoId];
    if (prev?.controller) {
      try {
        prev.controller.abort();
      } catch {
        /* no-op */
      }
    }

    // 1) append user + empty assistant
    setConversations((prevConvos) =>
      prevConvos.map((c) =>
        c.id === convoId
          ? {
              ...c,
              updatedAt: Date.now(),
              messages: [...c.messages, { role: "user", content: text }, { role: "assistant", content: "" }],
            }
          : c
      )
    );

    // 2) set up new stream registry entry
    const controller = new AbortController();
    const reqId = (prev?.reqId || 0) + 1;
    streamsRef.current[convoId] = { controller, reqId, lastTokenNorm: undefined };

    // 3) stream tokens
    try {
      await streamFromApi(
        convoId,
        text,
        (token) => {
          const reg = streamsRef.current[convoId];
          // Ignore stale stream emissions
          if (!reg || reg.reqId !== reqId) return;

          // Normalize token for de-dupe comparisons (trim only left to preserve spaces after words)
          const norm = token.replace(/\s+/g, " ");

          setConversations((prevConvos) =>
            prevConvos.map((c) => {
              if (c.id !== convoId) return c;

              const msgs = c.messages.slice();
              const last = msgs[msgs.length - 1];
              if (!last || last.role !== "assistant") return c;

              // If exact same normalized token arrives twice in a row, skip
              if (reg.lastTokenNorm === norm) {
                return c;
              }

              const before = last.content;
              const after = appendWithOverlap(before, token);

              // Update last seen token (normalized)
              reg.lastTokenNorm = norm;

              // Only set if changed (prevents double-paints)
              if (after !== before) {
                last.content = after;
                return { ...c, messages: msgs, updatedAt: Date.now() };
              }
              return c;
            })
          );
        },
        { signal: controller.signal }
      );
    } catch (err) {
      console.error("Stream failed:", err);
      // Show inline error
      setConversations((prevConvos) =>
        prevConvos.map((c) => {
          if (c.id !== convoId) return c;
          const msgs = c.messages.slice();
          const last = msgs[msgs.length - 1];
          if (last && last.role === "assistant") {
            last.content = "[stream error — check backend logs / CORS]";
          }
          return { ...c, messages: msgs, updatedAt: Date.now() };
        })
      );
    } finally {
      // Clear registry if this is still the active one
      const reg = streamsRef.current[convoId];
      if (reg && reg.reqId === reqId) {
        delete streamsRef.current[convoId];
      }
    }
  };

  /* ---------------------- Create / Delete / View helpers ---------------------- */
  const handleCreateFromDialog = ({ existingGroupId, newGroupName, title }) => {
    let groupId = existingGroupId;
    if (newGroupName && !groups.some((g) => g.name.toLowerCase() === newGroupName.toLowerCase())) {
      const newId = "g" + Date.now();
      const newGroup = { id: newId, name: newGroupName };
      setGroups((prev) => [...prev, newGroup]);
      groupId = newId;
    } else if (!groupId && groups[0]) {
      groupId = groups[0].id;
    }

    const id = "c" + Date.now();
    const chatTitle = title || `New Chat ${id.slice(-4)}`;
    const newChat = { id, title: chatTitle, groupId, updatedAt: Date.now(), messages: [] };

    setConversations((prev) => [...prev, newChat]);
    setActiveConvoId(id);
    setActiveGroupId(groupId);
    setActiveView("chat");
  };

  const handleDeleteChat = (id) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    setActiveConvoId((prev) => (prev === id ? null : prev));
  };

  const handleUploaded = (convoId, filesMeta) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === convoId ? { ...c, uploads: [...(c.uploads || []), ...filesMeta] } : c
      )
    );
  };

  const recentChats = useMemo(
    () => [...conversations].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5),
    [conversations]
  );

  const viewTitle = useMemo(() => {
    if (activeView === "shop") return "Shop";
    if (activeView === "flashcards") return "Flashcards";
    if (activeView === "pet") return "Pet";
    if (activeView === "group" && activeGroup) return `Space: ${activeGroup.name}`;
    return "Chat";
  }, [activeView, activeGroup]);

  /* --------------------------------- Render --------------------------------- */
  return (
    <div className="h-screen w-screen flex flex-col bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50">
      <TopBar viewTitle={viewTitle} points={points} onPointsClick={() => setShowPoints(!showPoints)} />

      <div className="flex-1 flex">
        {/* Sidebar */}
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

          {/* Recent chats (scrollable) */}
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

          {/* Spaces (scrollable) */}
          <SectionTitle>Spaces</SectionTitle>
          <div className="px-2 overflow-y-auto max-h-48">
            {groups.map((g) => (
              <ListItemButton
                key={g.id}
                active={activeGroupId === g.id && activeView === "group"}
                onClick={() => {
                  setActiveGroupId(g.id);
                  setActiveView("group");
                }}
              >
                {g.name}
              </ListItemButton>
            ))}
          </div>

          <Divider />

          {/* Other sections */}
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

        {/* Main */}
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
             <Flashcard
                groups={groups}
                apiBase={API_BASE}
                onEarn={(delta) => setPoints((p) => Math.max(0, p + delta))}
            />
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
            // <ChatView convo={activeConvo} onSend={handleSend} onDelete={handleDeleteChat} />
            <ChatView
              convo={activeConvo}
              onSend={handleSend}
              onDelete={handleDeleteChat}
              onUploaded={(filesMeta) => handleUploaded(activeConvoId, filesMeta)}
              apiBase={API_BASE}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default Navigation;

// // src/Components/Navigation.jsx
// import React, { useMemo, useState } from "react";
// import Store from "./Store.jsx";
// import Flashcard from "./Flashcard.jsx";
// import Pet from "./Pet.jsx";
// import NewChatDialog from "./NewChatDialog.jsx";

// const dummyReply = (text) => {
//   if (!text) return "Say something!";
//   if (text.toLowerCase().includes("hello"))
//     return "Hi there! How can I help today?";
//   if (text.toLowerCase().includes("weather"))
//     return "It's always sunny in AIVY land ☀️";
//   if (text.toLowerCase().includes("bye"))
//     return "Goodbye! Come back soon 👋";
//   return "This is a dummy AI response. Soon this will be replaced by a real model 🤖.";
// };

// // ---- helper components ----
// const SectionTitle = ({ children }) => (
//   <div className="px-3 pt-4 pb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 select-none">
//     {children}
//   </div>
// );

// const ListItemButton = ({ active, onClick, children, title }) => (
//   <button
//     type="button"
//     onClick={onClick}
//     title={title}
//     className={`w-full text-left px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 transition
//       ${active ? "bg-neutral-900 text-white" : "hover:bg-neutral-100 dark:hover:bg-neutral-800"}
//     `}
//   >
//     {children}
//   </button>
// );

// const Divider = () => <div className="my-3 h-px bg-neutral-200 dark:bg-neutral-800" />;

// const Coin = ({ className = "h-5 w-5" }) => (
//   <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
//     <circle cx="12" cy="12" r="10" fill="#f5d442" />
//     <circle cx="12" cy="12" r="6" fill="#fff2a8" />
//     <path d="M12 7v10M7 12h10" stroke="#c9a905" strokeWidth="1.5" strokeLinecap="round" />
//   </svg>
// );

// // ---- top bar ----
// const TopBar = ({ viewTitle, points, onPointsClick }) => (
//   <header className="h-14 border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-neutral-900/70 dark:border-neutral-800 px-4 flex items-center justify-between">
//     <div className="flex items-center gap-3">
//       <div className="select-none rounded-md bg-black text-white dark:bg-white dark:text-black px-2 py-1 text-xs font-bold">
//         AIVY
//       </div>
//       <div className="text-sm text-neutral-500">/</div>
//       <h1 className="text-sm font-medium">{viewTitle}</h1>
//     </div>

//     <button
//       type="button"
//       onClick={onPointsClick}
//       aria-label="Open points popover"
//       className="flex items-center gap-2 rounded-full px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:outline-none focus:ring-2"
//     >
//       <Coin />
//       <span className="font-semibold tabular-nums">{points.toLocaleString()}</span>
//     </button>
//   </header>
// );

// // ---- Chat View ----
// const ChatView = ({ convo, onSend, onDelete }) => {
//   const [input, setInput] = useState("");

//   if (!convo) return <div className="p-6 text-neutral-500">No chat selected</div>;

//   return (
//     <div className="h-full flex flex-col">
//       <div className="px-6 py-3 border-b flex justify-between items-center dark:border-neutral-800 text-sm text-neutral-600 dark:text-neutral-300">
//         <div>{convo.title}</div>
//         <button
//           onClick={() => onDelete(convo.id)}
//           className="text-xs text-red-500 hover:underline"
//         >
//           Delete Chat
//         </button>
//       </div>

//       {/* <div className="flex-1 overflow-auto px-6 py-6 space-y-4">
//         {convo.messages.map((m, idx) => (
//           <div
//             key={idx}
//             className={`max-w-3xl rounded-lg border p-3 whitespace-pre-wrap leading-relaxed text-sm ${
//               m.role === "assistant"
//                 ? "bg-neutral-50 dark:bg-neutral-900/50 border-neutral-200 dark:border-neutral-800"
//                 : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
//             }`}
//           >
//             {m.content}
//           </div>
//         ))}
//       </div> */}

//       {/* Message list */}
//         <div className="flex-1 overflow-auto px-6 py-6 space-y-4">
//         {convo.messages.map((m, idx) => {
//             const isUser = m.role === "user";
//             return (
//             <div
//                 key={idx}
//                 className={`flex ${isUser ? "justify-end" : "justify-start"}`}
//             >
//                 <div
//                 className={`max-w-[80%] rounded-xl border px-4 py-2 text-sm whitespace-pre-wrap leading-relaxed shadow-sm
//                     ${
//                     isUser
//                         ? "bg-blue-500 text-white border-blue-500 self-end"
//                         : "bg-neutral-50 dark:bg-neutral-900/50 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100"
//                     }`}
//                 >
//                 {m.content}
//                 </div>
//             </div>
//             );
//         })}
//         </div>

//       <div className="border-t dark:border-neutral-800 p-3">
//         <form
//           onSubmit={(e) => {
//             e.preventDefault();
//             onSend(input);
//             sendToBackend(activeConvoId, input, (token) => {
//                 // append streamed tokens to last assistant message
//                 });
//             // setInput("");
//           }}
//           className="flex items-center gap-2"
//         >
//           <input
//             value={input}
//             onChange={(e) => setInput(e.target.value)}
//             aria-label="Message"
//             className="flex-1 rounded-md border dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 outline-none focus:ring-2"
//             placeholder="Message AIVY…"
//           />
//           <button
//             type="submit"
//             className="rounded-md bg-black text-white dark:bg-white dark:text-black px-3 py-2 text-sm"
//           >
//             Send
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// };

// // ---- Group (Space) View ----
// const GroupView = ({ group, chats, onSelectChat }) => {
//   if (!group) return <div className="p-6 text-neutral-500">Select a space to view its chats</div>;

//   return (
//     <div className="p-6">
//       <h2 className="text-lg font-semibold mb-3">{group.name}</h2>
//       {chats.length === 0 ? (
//         <div className="text-neutral-500 text-sm">No chats yet in this space.</div>
//       ) : (
//         <div className="grid gap-2">
//           {chats.map((c) => (
//             <button
//               key={c.id}
//               onClick={() => onSelectChat(c.id)}
//               className="text-left border rounded-lg px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800"
//             >
//               <div className="font-medium">{c.title}</div>
//               <div className="text-xs text-neutral-500">
//                 {new Date(c.updatedAt).toLocaleString()}
//               </div>
//             </button>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// // ---- MAIN COMPONENT ----
// const Navigation = () => {
//   const [points, setPoints] = useState(1250);
//   const [showPoints, setShowPoints] = useState(false);
//   const [activeView, setActiveView] = useState("chat"); // chat | shop | pet | flashcards | group
//   const [activeConvoId, setActiveConvoId] = useState("c1");
//   const [activeGroupId, setActiveGroupId] = useState(null);
//   const [showNewDialog, setShowNewDialog] = useState(false);

//   const [groups, setGroups] = useState([
//     { id: "g-work", name: "Work" },
//     { id: "g-personal", name: "Personal" },
//   ]);

//   const [conversations, setConversations] = useState(() => [
//     {
//       id: "c1",
//       title: "Brainstorm startup ideas",
//       groupId: "g-work",
//       updatedAt: Date.now(),
//       messages: [
//         { role: "user", content: "Give me 5 startup ideas in health." },
//         { role: "assistant", content: "1) AI nutrition coach\n2) Sleep ring\n3) Physio app" },
//       ],
//     },
//   ]);

//   const activeConvo = conversations.find((c) => c.id === activeConvoId);
//   const activeGroup = groups.find((g) => g.id === activeGroupId);
//   const chatsInActiveGroup = conversations.filter((c) => c.groupId === activeGroupId);

//   const handleSend = (text) => {
//     if (!activeConvoId) return;
//     setConversations((prev) =>
//       prev.map((c) =>
//         c.id === activeConvoId
//           ? {
//               ...c,
//               updatedAt: Date.now(),
//               messages: [
//                 ...c.messages,
//                 { role: "user", content: text },
//                 { role: "assistant", content: dummyReply(text) },
//               ],
//             }
//           : c
//       )
//     );
//   };

//   const handleCreateFromDialog = ({ existingGroupId, newGroupName, title }) => {
//     let groupId = existingGroupId;
//     if (newGroupName && !groups.some((g) => g.name.toLowerCase() === newGroupName.toLowerCase())) {
//       const newId = "g" + Date.now();
//       const newGroup = { id: newId, name: newGroupName };
//       setGroups((prev) => [...prev, newGroup]);
//       groupId = newId;
//     } else if (!groupId && groups[0]) groupId = groups[0].id;

//     const id = "c" + Date.now();
//     const chatTitle = title || `New Chat ${id.slice(-4)}`;
//     const newChat = { id, title: chatTitle, groupId, updatedAt: Date.now(), messages: [] };

//     setConversations((prev) => [...prev, newChat]);
//     setActiveConvoId(id);
//     setActiveGroupId(groupId);
//     setActiveView("chat");
//   };

//   const handleDeleteChat = (id) => {
//     setConversations((prev) => prev.filter((c) => c.id !== id));
//     setActiveConvoId((prev) => (prev === id ? null : prev));
//   };

//   const recentChats = useMemo(
//     () => [...conversations].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5),
//     [conversations]
//   );

//   const viewTitle = useMemo(() => {
//     if (activeView === "shop") return "Shop";
//     if (activeView === "flashcards") return "Flashcards";
//     if (activeView === "pet") return "Pet";
//     if (activeView === "group" && activeGroup) return `Space: ${activeGroup.name}`;
//     return "Chat";
//   }, [activeView, activeGroup]);

//   return (
//     <div className="h-screen w-screen flex flex-col bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50">
//       <TopBar viewTitle={viewTitle} points={points} onPointsClick={() => setShowPoints(!showPoints)} />

//       <div className="flex-1 flex">
//         {/* SIDEBAR */}
//         <aside className="w-72 shrink-0 border-r dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 overflow-hidden flex flex-col">
//           {/* search + new */}
//           <div className="p-3 flex items-center gap-2">
//             <input
//               aria-label="Search"
//               placeholder="Search…"
//               className="flex-1 rounded-md border dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 text-sm outline-none focus:ring-2"
//             />
//             <button
//               type="button"
//               className="rounded-md bg-black text-white dark:bg-white dark:text-black px-3 py-2 text-sm"
//               onClick={() => setShowNewDialog(true)}
//             >
//               New
//             </button>
//           </div>

//           {/* recent chats */}
//           <SectionTitle>Recent</SectionTitle>
//           <div className="px-2 max-h-40 overflow-y-auto">
//             {recentChats.map((c) => (
//               <ListItemButton
//                 key={c.id}
//                 active={activeConvoId === c.id && activeView === "chat"}
//                 onClick={() => {
//                   setActiveConvoId(c.id);
//                   setActiveView("chat");
//                 }}
//               >
//                 {c.title}
//               </ListItemButton>
//             ))}
//           </div>

//           {/* <SectionTitle>Spaces</SectionTitle>
//           <div className="px-2 overflow-y-auto flex-1">
//             {groups.map((g) => (
//               <ListItemButton
//                 key={g.id}
//                 active={activeGroupId === g.id && activeView === "group"}
//                 onClick={() => {
//                   setActiveGroupId(g.id);
//                   setActiveView("group");
//                 }}
//               >
//                 {g.name}
//               </ListItemButton>
//             ))}
//           </div> */}
//           <SectionTitle>Spaces</SectionTitle>
//             <div className="px-2 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-700 scrollbar-track-transparent max-h-48">
//             {groups.map((g) => (
//                 <ListItemButton
//                 key={g.id}
//                 active={activeGroupId === g.id && activeView === "group"}
//                 onClick={() => {
//                     setActiveGroupId(g.id);
//                     setActiveView("group");
//                 }}
//                 >
//                 {g.name}
//                 </ListItemButton>
//             ))}
//             </div>

//           <Divider />

//           <div className="px-2 pb-3">
//             <ListItemButton active={activeView === "shop"} onClick={() => setActiveView("shop")}>
//               🛒 <span className="ml-2">Shop</span>
//             </ListItemButton>
//             <ListItemButton active={activeView === "flashcards"} onClick={() => setActiveView("flashcards")}>
//               🧠 <span className="ml-2">Flashcards</span>
//             </ListItemButton>
//             <ListItemButton active={activeView === "pet"} onClick={() => setActiveView("pet")}>
//               🐣 <span className="ml-2">Pet</span>
//             </ListItemButton>
//           </div>
//         </aside>

//         {/* MAIN VIEW */}
//         <main className="flex-1 min-w-0">
//           <NewChatDialog
//             open={showNewDialog}
//             onClose={() => setShowNewDialog(false)}
//             groups={groups}
//             onCreate={handleCreateFromDialog}
//           />

//           {activeView === "shop" ? (
//             <Store />
//           ) : activeView === "flashcards" ? (
//             <Flashcard />
//           ) : activeView === "pet" ? (
//             <Pet points={points} onEarn={(amt) => setPoints((p) => p + amt)} />
//           ) : activeView === "group" ? (
//             <GroupView
//               group={activeGroup}
//               chats={chatsInActiveGroup}
//               onSelectChat={(id) => {
//                 setActiveConvoId(id);
//                 setActiveView("chat");
//               }}
//             />
//           ) : (
//             <ChatView convo={activeConvo} onSend={handleSend} onDelete={handleDeleteChat} />
//           )}
//         </main>
//       </div>
//     </div>
//   );
// };

// export default Navigation;