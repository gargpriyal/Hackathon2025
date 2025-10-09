// src/Components/NewChatDialog.jsx
import React, { useMemo, useState, useEffect } from "react";
import Modal from "./Modal.jsx";
import { Plus, Pencil, Trash2 } from "lucide-react";

/**
 * Props:
 *  - open: boolean
 *  - onClose: () => void
 *  - spaces: Array<{ id:string, name:string }>
 *  - onCreate: ({ existingSpaceId?: string, newSpaceName?: string, title?: string }) => Promise<void> | void
 *  - onCreateSpace?: (name:string) => Promise<void> | void
 *  - onRenameSpace?: (spaceId:string, nextName:string) => Promise<void> | void
 *  - onDeleteSpace?: (spaceId:string) => Promise<void> | void
 *  - chatsBySpace?: Record<string, Array<{ id:string, title:string }>>
 *  - onDeleteChat?: (chatId:string) => Promise<void> | void
 */
const NewChatDialog = ({
  open,
  onClose,
  spaces = [],
  onCreate,
  onCreateSpace,
  onRenameSpace,
  onDeleteSpace,
  chatsBySpace = {},
  onDeleteChat,
}) => {
  // Keep an id+name shape internally
  const safeSpaces = Array.isArray(spaces)
    ? spaces.map((s) => ({ id: s.id, name: s.name }))
    : [];

  const [existingSpaceId, setExistingSpaceId] = useState(
    safeSpaces[0]?.id ?? ""
  );
  const [newSpaceName, setNewSpaceName] = useState("");
  const [title, setTitle] = useState("");
  const [quickSpaceName, setQuickSpaceName] = useState("");

  // keep select in sync when spaces change
  useEffect(() => {
    if (!existingSpaceId && safeSpaces[0]) {
      setExistingSpaceId(safeSpaces[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spaces]);

  const hasNewSpace = newSpaceName.trim().length > 0;
  const spaceNameExists = useMemo(
    () =>
      safeSpaces.some(
        (s) => s.name.toLowerCase() === newSpaceName.trim().toLowerCase()
      ),
    [safeSpaces, newSpaceName]
  );

  const canCreateChat = hasNewSpace
    ? !spaceNameExists
    : !!existingSpaceId || safeSpaces.length === 0;

  const selectedChats = chatsBySpace[existingSpaceId] || [];

  const resetAndClose = () => {
    setTitle("");
    setNewSpaceName("");
    setQuickSpaceName("");
    setExistingSpaceId(safeSpaces[0]?.id ?? "");
    onClose();
  };

  const handleCreateChat = async () => {
    if (typeof onCreate === "function") {
      await onCreate({
        existingSpaceId: hasNewSpace ? undefined : existingSpaceId || undefined,
        newSpaceName: hasNewSpace ? newSpaceName.trim() : undefined,
        title: title.trim() || undefined,
      });
    }
    resetAndClose();
  };

  const handleQuickCreateSpace = async () => {
    const name = quickSpaceName.trim();
    if (!name) return;
    if (safeSpaces.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      alert("A space with this name already exists.");
      return;
    }
    if (onCreateSpace) {
      await onCreateSpace(name);
      setQuickSpaceName("");
    }
  };

  const handleRenameSpace = async () => {
    if (!existingSpaceId) return;
    const current =
      safeSpaces.find((s) => s.id === existingSpaceId)?.name || "";
    const next = window.prompt("Rename space to…", current);
    if (!next || next.trim() === current) return;
    if (onRenameSpace) await onRenameSpace(existingSpaceId, next.trim());
  };

  const handleDeleteSpace = async () => {
    if (!existingSpaceId) return;
    if (!window.confirm("Delete this space?")) return;
    if (onDeleteSpace) await onDeleteSpace(existingSpaceId);
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
            Choose a Space
          </div>

          <div className="p-4 space-y-4">
            {/* Existing space + manage */}
            <div>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-medium mb-1 text-[color:var(--color-text)]/80">
                    Select existing
                  </label>
                  <select
                    value={existingSpaceId}
                    onChange={(e) => setExistingSpaceId(e.target.value)}
                    disabled={hasNewSpace}
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
                    {safeSpaces.length === 0 && (
                      <option value="">No spaces yet</option>
                    )}
                    {safeSpaces.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    title="Rename space"
                    onClick={handleRenameSpace}
                    disabled={!existingSpaceId || !onRenameSpace}
                    className={`
                      p-2 rounded-xl border border-[color:var(--color-border)]
                      ${
                        existingSpaceId && onRenameSpace
                          ? "hover:bg-[color:var(--color-accent-weak)] hover:text-[color:var(--color-on-accent)]"
                          : "opacity-50 cursor-not-allowed"
                      }
                    `}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    title="Delete space"
                    onClick={handleDeleteSpace}
                    disabled={!existingSpaceId || !onDeleteSpace}
                    className={`
                      p-2 rounded-xl border border-[color:var(--color-border)]
                      ${
                        existingSpaceId && onDeleteSpace
                          ? "hover:bg-[color:var(--color-accent-strong)] hover:text-[color:var(--color-on-accent)]"
                          : "opacity-50 cursor-not-allowed"
                      }
                    `}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {hasNewSpace && (
                <div className="mt-1 text-xs text-[color:var(--color-text)]/60">
                  New space name entered — dropdown disabled.
                </div>
              )}
            </div>

            {/* New space for this chat */}
            <div>
              <label className="block text-xs font-medium mb-1 text-[color:var(--color-text)]/80">
                Or create a new space (for this chat)
              </label>
              <input
                value={newSpaceName}
                onChange={(e) => setNewSpaceName(e.target.value)}
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
              {newSpaceName && spaceNameExists && (
                <div className="mt-1 text-xs text-rose-600">
                  A space with this name already exists.
                </div>
              )}
            </div>

            {/* Quick space management (optional) */}
            <div className="border-t border-[color:var(--color-border)] pt-3">
              <div className="text-xs font-semibold mb-2">
                Manage spaces (quick)
              </div>
              <div className="flex items-center gap-2">
                <input
                  value={quickSpaceName}
                  onChange={(e) => setQuickSpaceName(e.target.value)}
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
                  onClick={handleQuickCreateSpace}
                  disabled={!onCreateSpace || !quickSpaceName.trim()}
                  className={`
                    inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm
                    ${
                      onCreateSpace && quickSpaceName.trim()
                        ? "bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)] shadow-sm"
                        : "bg-[color:var(--color-panel)] text-[color:var(--color-text)]/50 border border-[color:var(--color-border)] cursor-not-allowed"
                    }
                  `}
                >
                  <Plus className="h-4 w-4" /> Create
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Existing chats list (optional) */}
        {existingSpaceId && selectedChats.length > 0 && (
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
                  <div className="text-sm truncate">
                    {ch.title || "Untitled chat"}
                  </div>
                  <button
                    type="button"
                    title="Delete chat"
                    onClick={() => handleDeleteChatLocal(ch.id)}
                    disabled={!onDeleteChat}
                    className={`
                      p-1.5 rounded-lg border border-[color:var(--color-border)]
                      ${
                        onDeleteChat
                          ? "hover:bg-[color:var(--color-accent-weak)] hover:text-[color:var(--color-on-accent)]"
                          : "opacity-50 cursor-not-allowed"
                      }
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
            {hasNewSpace ? (
              <span
                className="
                  px-2 py-1 rounded-xl border
                  border-[color:var(--color-border)]
                  text-[color:var(--color-text)]
                "
              >
                {spaceNameExists ? "Space exists" : "Create new space & chat"}
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
                ${
                  canCreateChat
                    ? "bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)] shadow"
                    : "bg-[color:var(--color-panel)] text-[color:var(--color-text)]/50 border border-[color:var(--color-border)] cursor-not-allowed"
                }
              `}
              title={
                canCreateChat
                  ? "Create chat"
                  : "Choose a space or type a new one"
              }
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