// src/Components/NewChatDialog.jsx
import React, { useMemo, useState } from "react";
import Modal from "./Modal.jsx";

/**
 * Props:
 *  - open: boolean
 *  - onClose: () => void
 *  - groups: Array<{id:string, name:string}>
 *  - onCreate: ({ existingGroupId?: string, newGroupName?: string, title?: string }) => void
 */
const NewChatDialog = ({ open, onClose, groups = [], onCreate }) => {
  const [existingGroupId, setExistingGroupId] = useState(groups[0]?.id ?? "");
  const [newGroupName, setNewGroupName] = useState("");
  const [title, setTitle] = useState("");

  const hasNewGroup = newGroupName.trim().length > 0;
  const groupNameExists = useMemo(
    () => groups.some((g) => g.name.toLowerCase() === newGroupName.trim().toLowerCase()),
    [groups, newGroupName]
  );

  const handleCreate = () => {
    onCreate({
      existingGroupId: hasNewGroup ? undefined : existingGroupId || undefined,
      newGroupName: hasNewGroup ? newGroupName.trim() : undefined,
      title: title.trim() || undefined,
    });
    // reset local inputs after create
    setTitle("");
    setNewGroupName("");
    setExistingGroupId(groups[0]?.id ?? "");
    onClose();
  };

  const canCreate =
    (hasNewGroup ? !groupNameExists : !!existingGroupId || groups.length === 0);

  return (
    <Modal open={open} onClose={onClose} title="New Chat">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium mb-1">Chat name (optional)</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Brainstorm blog ideas"
            className="w-full rounded-md border dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 text-sm outline-none focus:ring-2"
          />
        </div>

        <div className="border rounded-lg dark:border-neutral-800">
          <div className="px-3 py-2 border-b dark:border-neutral-800 text-xs font-semibold">
            Choose a Space (group)
          </div>

          <div className="p-3 space-y-3">
            {/* Existing group dropdown */}
            <div>
              <label className="block text-xs font-medium mb-1">Select existing</label>
              <select
                value={existingGroupId}
                onChange={(e) => setExistingGroupId(e.target.value)}
                className="w-full rounded-md border dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 text-sm outline-none focus:ring-2"
                disabled={hasNewGroup}
              >
                {groups.length === 0 && <option value="">No groups yet</option>}
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
              {hasNewGroup && (
                <div className="mt-1 text-xs text-neutral-500">
                  New group name entered — dropdown disabled.
                </div>
              )}
            </div>

            {/* New group input */}
            <div>
              <label className="block text-xs font-medium mb-1">Or create new</label>
              <input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="e.g., Research"
                className="w-full rounded-md border dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 text-sm outline-none focus:ring-2"
              />
              {newGroupName && groupNameExists && (
                <div className="mt-1 text-xs text-red-500">A group with this name already exists.</div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs">
            {hasNewGroup ? (
              <span className={`px-2 py-1 rounded ${groupNameExists ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"}`}>
                {groupNameExists ? "Group exists" : "Create group"}
              </span>
            ) : (
              <span className="px-2 py-1 rounded bg-neutral-100 text-neutral-700">Use selected group</span>
            )}
          </div>

          <button
            disabled={!canCreate}
            onClick={handleCreate}
            className={`rounded-md px-3 py-1.5 text-sm ${
              canCreate
                ? "bg-black text-white dark:bg-white dark:text-black"
                : "bg-neutral-200 text-neutral-500 cursor-not-allowed"
            }`}
            title={canCreate ? "Create chat" : "Choose a group or type a new one"}
          >
            Create
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default NewChatDialog;