// src/Components/UploadButton.jsx
import React, { useRef, useState } from "react";

/**
 * Props:
 * - apiBase: string (e.g. "http://127.0.0.1:8787")
 * - conversationId: string
 * - onUploaded: (filesMeta: Array) => void    // called with backend response.files
 */
const UploadButton = ({ apiBase, conversationId, onUploaded }) => {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const onPick = () => inputRef.current?.click();

  const onChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setBusy(true);
    setErr("");

    try {
      const fd = new FormData();
      files.forEach((f) => fd.append("files", f));
      if (conversationId) fd.append("conversation_id", conversationId);

      const res = await fetch(`${apiBase}/api/uploads`, {
        method: "POST",
        body: fd,
      });

      const text = await res.text();
      let payload = null;
      try {
        payload = JSON.parse(text);
      } catch {
        throw new Error(`Bad JSON from server: ${text.slice(0, 200)}`);
      }

      if (!res.ok || !payload?.ok) {
        throw new Error(payload?.error?.message || `HTTP ${res.status}`);
      }

      onUploaded?.(payload.files || []);
      // reset picker so selecting same file again still fires change
      e.target.value = "";
    } catch (ex) {
      console.error("[upload] error:", ex);
      setErr(String(ex.message || ex));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".txt,.md,.pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
        className="hidden"
        onChange={onChange}
      />
      <button
        type="button"
        onClick={onPick}
        disabled={busy}
        className={`rounded-md px-2 py-1.5 text-sm border ${
          busy ? "bg-neutral-200 text-neutral-500 cursor-not-allowed" : "bg-white hover:bg-neutral-100"
        }`}
        title="Attach files"
      >
        📎 Attach
      </button>
      {busy && <span className="text-xs text-neutral-500">Uploading…</span>}
      {err && <span className="text-xs text-red-500">{err}</span>}
    </div>
  );
};

export default UploadButton;