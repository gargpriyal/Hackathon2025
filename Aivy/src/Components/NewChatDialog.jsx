// src/Components/NewChatDialog.jsx
import React, { useMemo, useState, useEffect } from "react";
import Modal from "./Modal.jsx";
import { Plus, Pencil, Trash2 } from "lucide-react";

const NewChatDialog = ({
  open,
  onClose,
  groups = [],
  onCreate,
  onCreateGroup,
  onRenameGroup,
  onDeleteGroup,
  chatsByGroup = {},
  onDeleteChat,
}) => {
  // Fallback demo groups so the UI looks complete during integration
  const fallbackGroups = [
    { id: "g-demo-1", name: "General" },
    { id: "g-demo-2", name: "Research" },
  ];
  const safeGroups = groups.length ? groups : fallbackGroups;

  const [existingGroupId, setExistingGroupId] = useState(safeGroups[0]?.id ?? "");
  const [newGroupName, setNewGroupName] = useState("");
  const [title, setTitle] = useState("");
  const [quickGroupName, setQuickGroupName] = useState("");

  useEffect(() => {
    // keep select in sync when groups change
    if (!existingGroupId && safeGroups[0]) setExistingGroupId(safeGroups[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups]);

  const hasNewGroup = newGroupName.trim().length > 0;
  const groupNameExists = useMemo(
    () => safeGroups.some((g) => g.name.toLowerCase() === newGroupName.trim().toLowerCase()),
    [safeGroups, newGroupName]
  );

  const canCreateChat = hasNewGroup ? !groupNameExists : !!existingGroupId || safeGroups.length === 0;
  const selectedChats = chatsByGroup[existingGroupId] || [];

  const resetAndClose = () => {
    setTitle("");
    setNewGroupName("");
    setQuickGroupName("");
    setExistingGroupId(safeGroups[0]?.id ?? "");
    onClose();
  };

  const handleCreateChat = async () => {
    if (typeof onCreate === "function") {
      await onCreate({
        existingGroupId: hasNewGroup ? undefined : existingGroupId || undefined,
        newGroupName: hasNewGroup ? newGroupName.trim() : undefined,
        title: title.trim() || undefined,
      });
    }
    resetAndClose();
  };

  const handleQuickCreateGroup = async () => {
    const name = quickGroupName.trim();
    if (!name) return;
    if (safeGroups.some((g) => g.name.toLowerCase() === name.toLowerCase())) {
      alert("A space with this name already exists.");
      return;
    }
    if (onCreateGroup) {
      await onCreateGroup(name);
      setQuickGroupName("");
    }
  };

  const handleRenameGroup = async () => {
    if (!existingGroupId) return;
    const current = safeGroups.find((g) => g.id === existingGroupId)?.name || "";
    const next = window.prompt("Rename space to…", current);
    if (!next || next.trim() === current) return;
    if (onRenameGroup) await onRenameGroup(existingGroupId, next.trim());
  };

  const handleDeleteGroup = async () => {
    if (!existingGroupId) return;
    if (!window.confirm("Delete this space (group)?")) return;
    if (onDeleteGroup) await onDeleteGroup(existingGroupId);
  };

  const handleDeleteChatLocal = async (chatId) => {
    if (!chatId) return;
    if (!window.confirm("Delete this chat?")) return;
    if (onDeleteChat) await onDeleteChat(chatId);
  };

  return (
    <Modal open={open} onClose={resetAndClose} title="New Chat">
      <div
        className="
          space-y-4
          bg-[color:var(--color-panel)]
          text-[color:var(--color-text)]
          rounded-2xl p-5 shadow-lg
          border border-[color:var(--color-border)]
        "
      >
        {/* Chat title */}
        <div>
          <label className="block text-xs font-semibold mb-1 text-[color:var(--color-text)]/80">
            Chat name (optional)
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Brainstorm blog ideas"
            className="
              w-full rounded-xl
              bg-[color:var(--color-panel)]
              text-[color:var(--color-text)]
              border border-[color:var(--color-border)]
              px-4 py-2.5 text-sm
              placeholder:text-[color:var(--color-text)]/40
              focus:outline-none focus:ring-2 focus:ring-[--color-accent]
            "
          />
        </div>

        {/* Space selection & manage */}
        <div className="border border-[color:var(--color-border)] rounded-2xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-[color:var(--color-border)] text-xs font-semibold">
            Choose a Space (group)
          </div>

          <div className="p-4 space-y-4">
            {/* Existing group + manage */}
            <div>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-medium mb-1 text-[color:var(--color-text)]/80">
                    Select existing
                  </label>
                  <select
                    value={existingGroupId}
                    onChange={(e) => setExistingGroupId(e.target.value)}
                    disabled={hasNewGroup}
                    className="
                      w-full rounded-xl
                      bg-[color:var(--color-panel)]
                      text-[color:var(--color-text)]
                      border border-[color:var(--color-border)]
                      px-3 py-2 text-sm
                      focus:outline-none focus:ring-2 focus:ring-[--color-accent]
                      disabled:opacity-60 disabled:cursor-not-allowed
                    "
                  >
                    {safeGroups.length === 0 && <option value="">No spaces yet</option>}
                    {safeGroups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    title="Rename space"
                    onClick={handleRenameGroup}
                    disabled={!existingGroupId || !onRenameGroup}
                    className={`
                      p-2 rounded-xl border border-[color:var(--color-border)]
                      ${existingGroupId && onRenameGroup
                        ? "hover:bg-[color:var(--color-accent-weak)] hover:text-[color:var(--color-on-accent)]"
                        : "opacity-50 cursor-not-allowed"}
                    `}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    title="Delete space"
                    onClick={handleDeleteGroup}
                    disabled={!existingGroupId || !onDeleteGroup}
                    className={`
                      p-2 rounded-xl border border-[color:var(--color-border)]
                      ${existingGroupId && onDeleteGroup
                        ? "hover:bg-[color:var(--color-accent-strong)] hover:text-[color:var(--color-on-accent)]"
                        : "opacity-50 cursor-not-allowed"}
                    `}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {hasNewGroup && (
                <div className="mt-1 text-xs text-[color:var(--color-text)]/60">
                  New space name entered — dropdown disabled.
                </div>
              )}
            </div>

            {/* New group for this chat */}
            <div>
              <label className="block text-xs font-medium mb-1 text-[color:var(--color-text)]/80">
                Or create a new space (for this chat)
              </label>
              <input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="e.g., Research"
                className="
                  w-full rounded-xl
                  bg-[color:var(--color-panel)]
                  text-[color:var(--color-text)]
                  border border-[color:var(--color-border)]
                  px-4 py-2.5 text-sm
                  placeholder:text-[color:var(--color-text)]/40
                  focus:outline-none focus:ring-2 focus:ring-[--color-accent]
                "
              />
              {newGroupName && groupNameExists && (
                <div className="mt-1 text-xs text-rose-600">
                  A space with this name already exists.
                </div>
              )}
            </div>

            {/* Quick group management */}
            <div className="border-t border-[color:var(--color-border)] pt-3">
              <div className="text-xs font-semibold mb-2">Manage spaces (quick)</div>
              <div className="flex items-center gap-2">
                <input
                  value={quickGroupName}
                  onChange={(e) => setQuickGroupName(e.target.value)}
                  placeholder="New space name…"
                  className="
                    flex-1 rounded-xl
                    bg-[color:var(--color-panel)]
                    text-[color:var(--color-text)]
                    border border-[color:var(--color-border)]
                    px-3 py-2 text-sm
                    placeholder:text-[color:var(--color-text)]/40
                    focus:outline-none focus:ring-2 focus:ring-[--color-accent]
                  "
                />
                <button
                  type="button"
                  onClick={handleQuickCreateGroup}
                  disabled={!onCreateGroup || !quickGroupName.trim()}
                  className={`
                    inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm
                    ${onCreateGroup && quickGroupName.trim()
                      ? "bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)] shadow-sm"
                      : "bg-[color:var(--color-panel)] text-[color:var(--color-text)]/50 border border-[color:var(--color-border)] cursor-not-allowed"}
                  `}
                >
                  <Plus className="h-4 w-4" /> Create
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Existing chats list */}
        {existingGroupId && selectedChats.length > 0 && (
          <div className="border border-[color:var(--color-border)] rounded-2xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-[color:var(--color-border)] text-xs font-semibold">
              Chats in selected space
            </div>
            <div className="p-2 max-h-40 overflow-auto">
              {selectedChats.map((ch) => (
                <div
                  key={ch.id}
                  className="
                    flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg
                    hover:bg-[color:var(--color-accent-weak)] hover:text-[color:var(--color-on-accent)]
                    transition
                  "
                >
                  <div className="text-sm truncate">{ch.title || "Untitled chat"}</div>
                  <button
                    type="button"
                    title="Delete chat"
                    onClick={() => handleDeleteChatLocal(ch.id)}
                    disabled={!onDeleteChat}
                    className={`
                      p-1.5 rounded-lg border border-[color:var(--color-border)]
                      ${onDeleteChat
                        ? "hover:bg-[color:var(--color-accent-weak)] hover:text-[color:var(--color-on-accent)]"
                        : "opacity-50 cursor-not-allowed"}
                    `}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="text-xs">
            {hasNewGroup ? (
              <span
                className="
                  px-2 py-1 rounded-xl border
                  border-[color:var(--color-border)]
                  text-[color:var(--color-text)]
                "
              >
                {groupNameExists ? "Space exists" : "Create new space & chat"}
              </span>
            ) : (
              <span className="px-2 py-1 rounded-xl border border-[color:var(--color-border)] text-[color:var(--color-text)]">
                Use selected space
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={resetAndClose}
              className="
                rounded-xl px-3 py-2 text-sm
                bg-[color:var(--color-panel)]
                text-[color:var(--color-text)]
                border border-[color:var(--color-border)]
                hover:shadow-sm transition
              "
            >
              Cancel
            </button>
            <button
              disabled={!canCreateChat}
              onClick={handleCreateChat}
              className={`
                rounded-xl px-4 py-2 text-sm font-semibold transition
                ${canCreateChat
                  ? "bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)] shadow"
                  : "bg-[color:var(--color-panel)] text-[color:var(--color-text)]/50 border border-[color:var(--color-border)] cursor-not-allowed"}
              `}
              title={canCreateChat ? "Create chat" : "Choose a space or type a new one"}
            >
              Create Chat
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default NewChatDialog;