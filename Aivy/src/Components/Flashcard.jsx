// src/Components/Flashcard.jsx
import React, { useEffect, useMemo, useState } from "react";

/**
 * Props:
 * - groups: Array<{ id, name }>
 * - onEarn: (delta:number) => void
 * - apiBase?: string
 * - preferBackend?: boolean  // default: true (do NOT fallback silently)
 */
const Flashcard = ({
  groups = [],
  onEarn = () => {},
  apiBase = "http://127.0.0.1:8787",
  preferBackend = true,
}) => {
  const [groupId, setGroupId] = useState("all");  // "all" or a group id
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [cards, setCards] = useState([]);         // [{id,question,options[],correctIndex}]
  const [idx, setIdx] = useState(0);
  const [choice, setChoice] = useState(null);
  const [status, setStatus] = useState("idle");   // idle|submitted|finished

  const current = cards[idx];

  // Map selected id -> group name, or "all"
  const groupName = useMemo(() => {
    if (groupId === "all") return "all";
    const g = groups.find((x) => x.id === groupId);
    return g ? g.name : "all";
  }, [groupId, groups]);

  // Fetch questions on group change
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setErr("");
      setCards([]);
      setIdx(0);
      setChoice(null);
      setStatus("idle");

      const url = `${apiBase}/api/flashcards?group=${encodeURIComponent(groupName)}`;
      console.log("[flashcards] fetching:", url);

      try {
        const res = await fetch(url, { headers: { "Accept": "application/json" } });
        const bodyText = await res.text();
        console.log("[flashcards] status:", res.status, "body:", bodyText);

        if (!res.ok) throw new Error(`HTTP ${res.status}: ${bodyText || "Failed"}`);

        const data = JSON.parse(bodyText);
        if (!Array.isArray(data?.cards)) throw new Error("Invalid shape: expected { cards: [] }");

        if (!cancelled) setCards(data.cards);
      } catch (e) {
        console.error("[flashcards] fetch error:", e);
        if (preferBackend) {
          // show the error; do NOT fallback silently
          if (!cancelled) setErr(String(e.message || e));
        } else {
          // optional local fallback
          const dummy = makeLocalDummy(groupName);
          if (!cancelled) {
            setErr("Backend unavailable — using local dummy set.");
            setCards(dummy);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [groupName, apiBase, preferBackend]);

  const onSubmit = (e) => {
    e.preventDefault();
    if (choice == null || !current) return;

    if (choice === current.correctIndex) {
      onEarn(3);
    } else {
      onEarn(-1);
    }
    setStatus("submitted");

    setTimeout(() => {
      if (idx + 1 < cards.length) {
        setIdx((i) => i + 1);
        setChoice(null);
        setStatus("idle");
      } else {
        setStatus("finished");
      }
    }, 700);
  };

  return (
    <div className="h-full w-full p-6 flex flex-col gap-4">
      {/* Top controls */}
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">Flashcards</h2>
        <div className="flex items-center gap-2">
          <label htmlFor="fc-group" className="text-sm text-neutral-600 dark:text-neutral-400">
            Group:
          </label>
          <select
            id="fc-group"
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            className="text-sm rounded-md border dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 outline-none focus:ring-2"
            aria-label="Select flashcard group"
          >
            <option value="all">All</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Card area */}
      <div className="flex-1 grid place-items-center">
        <div className="w-full max-w-2xl rounded-2xl border dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
          <div className="px-5 py-4 border-b dark:border-neutral-800 flex items-center justify-between">
            <div className="text-sm text-neutral-600 dark:text-neutral-300">
              {loading
                ? "Loading…"
                : err
                ? "Error"
                : status === "finished"
                ? "Done"
                : cards.length
                ? `Question ${idx + 1} of ${cards.length} (${groupName})`
                : `No questions (${groupName})`}
            </div>
            {status !== "finished" && cards.length > 0 && (
              <div className="text-xs rounded bg-neutral-100 dark:bg-neutral-800 px-2 py-1">
                {current ? `${current.options.length} option${current.options.length > 1 ? "s" : ""}` : ""}
              </div>
            )}
          </div>

          <div className="px-5 py-6">
            {loading ? (
              <div className="text-neutral-500 text-sm">Fetching questions…</div>
            ) : err ? (
              <div className="text-red-500 text-sm">
                {err}
                <div className="mt-2">
                  Check your API at <code>{apiBase}/api/flashcards</code> and CORS. See console logs for details.
                </div>
              </div>
            ) : status === "finished" ? (
              <div className="text-center py-8">
                <div className="text-xl font-semibold mb-2">You’ve reached the end 🎉</div>
                <button
                  className="mt-2 rounded-md bg-black text-white dark:bg-white dark:text-black px-3 py-2 text-sm"
                  onClick={() => {
                    // reload same group
                    setGroupId((g) => g);
                  }}
                >
                  Restart
                </button>
              </div>
            ) : current ? (
              <form onSubmit={onSubmit} className="space-y-6">
                <div className="text-base font-medium">{current.question}</div>

                <fieldset className="space-y-2" aria-label="Options">
                  {current.options.map((opt, i) => {
                    const selected = choice === i;
                    const isCorrect = status === "submitted" && i === current.correctIndex;
                    const isWrongSelected = status === "submitted" && selected && i !== current.correctIndex;
                    return (
                      <label
                        key={i}
                        className={`flex items-center gap-3 rounded-md border px-3 py-2 cursor-pointer
                          ${
                            selected
                              ? "border-blue-500 ring-2 ring-blue-200"
                              : "border-neutral-200 dark:border-neutral-800"
                          }
                          ${
                            isCorrect
                              ? "bg-green-50 dark:bg-green-900/20 border-green-500"
                              : isWrongSelected
                              ? "bg-red-50 dark:bg-red-900/20 border-red-500"
                              : ""
                          }
                        `}
                      >
                        <input
                          type="radio"
                          name="fc-option"
                          className="accent-blue-600"
                          checked={selected}
                          onChange={() => setChoice(i)}
                          aria-checked={selected}
                        />
                        <span className="text-sm">{opt}</span>
                      </label>
                    );
                  })}
                </fieldset>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="submit"
                    disabled={choice == null || status !== "idle"}
                    className={`rounded-md px-3 py-2 text-sm
                      ${
                        choice == null || status !== "idle"
                          ? "bg-neutral-200 text-neutral-500 cursor-not-allowed"
                          : "bg-black text-white dark:bg-white dark:text-black"
                      }`}
                  >
                    Submit
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-neutral-500 text-sm">No questions available.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Flashcard;

