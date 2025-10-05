import React, { useEffect, useMemo, useState } from "react";
import { Loader2, ChevronRight, RotateCcw, CheckCircle2 } from "lucide-react";

const API_BASE = "http://127.0.0.1:8787";

/**
 * Flashcards pull from backend only (no local fallback).
 * Props:
 *  - groups: [{id, name}] to render the group selector
 *  - onEarn: (delta:number) => void  // +3 correct, -1 wrong
 */
const Flashcard = ({ groups = [{ id: "g-all", name: "All" }], onEarn }) => {
  // Map your app's groups into backend keys (all/work/personal/...)
  const groupOptions = useMemo(() => {
    const base = [{ key: "all", label: "All" }];
    const rest = (groups || [])
      .map((g) => ({ key: (g.name || "").toLowerCase(), label: g.name }))
      .filter((g) => g.key && g.key !== "all");
    const seen = new Set();
    return [...base, ...rest].filter((g) => {
      if (seen.has(g.key)) return false;
      seen.add(g.key);
      return true;
    });
  }, [groups]);

  const [selectedGroup, setSelectedGroup] = useState("all");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [cards, setCards] = useState([]); // [{id,question,options,correctIndex}]
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [totalDelta, setTotalDelta] = useState(0);

  // fetch cards on group change
  useEffect(() => {
    let cancelled = false;
    const fetchCards = async () => {
      setLoading(true);
      setErr("");
      setCards([]);
      setIdx(0);
      setPicked(null);
      setTotalDelta(0);
      try {
        const res = await fetch(
          `${API_BASE}/api/flashcards?group=${encodeURIComponent(selectedGroup)}`
        );
        if (!res.ok) {
          const t = await res.text();
          throw new Error(`HTTP ${res.status}: ${t}`);
        }
        const data = await res.json(); // { cards: [...] }
        if (!cancelled) setCards(Array.isArray(data.cards) ? data.cards : []);
      } catch (e) {
        if (!cancelled) setErr(e.message || "Failed to load flashcards");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchCards();
    return () => {
      cancelled = true;
    };
  }, [selectedGroup]);

  const current = cards[idx];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (picked == null || !current) return;
    const correct = picked === current.correctIndex;
    const delta = correct ? 3 : -1;
    setTotalDelta((d) => d + delta);
    if (typeof onEarn === "function") onEarn(delta);
    // next card
    setPicked(null);
    setIdx((i) => i + 1);
  };

  const handleRestart = () => {
    setIdx(0);
    setPicked(null);
    setTotalDelta(0);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold text-[color:var(--color-text)]">Flashcards</h2>
        <div className="flex items-center gap-2">
          <label htmlFor="group" className="text-sm text-[color:var(--color-text)]/70">
            Group
          </label>
          <select
            id="group"
            className="rounded-lg bg-[color:var(--color-panel)] border border-[color:var(--color-border)] shadow-sm px-3 py-2 text-sm text-[color:var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[--color-accent]"
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
          >
            {groupOptions.map((g) => (
              <option key={g.key} value={g.key}>
                {g.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Body */}
      <div className="bg-[color:var(--color-panel)] border border-[color:var(--color-border)] rounded-2xl shadow p-5">
        {loading ? (
          <div className="flex items-center gap-2 text-[color:var(--color-text)]/80">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading cards…
          </div>
        ) : err ? (
          <div className="text-rose-600">
            <div className="font-medium mb-1">Failed to load flashcards</div>
            <div className="text-sm">{err}</div>
          </div>
        ) : !current ? (
          <div className="text-center">
            <div className="text-[color:var(--color-text)] font-semibold text-lg mb-1">All done!</div>
            <div className="text-[color:var(--color-text)]/80 mb-4">
              Total score change:{" "}
              <span className={totalDelta >= 0 ? "text-emerald-600" : "text-rose-600"}>
                {totalDelta >= 0 ? "+" : ""}
                {totalDelta}
              </span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={handleRestart}
                className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)] shadow-md hover:shadow-lg hover:bg-[color:var(--color-accent-weak)] active:bg-[color:var(--color-accent-strong)] px-4 py-2 transition"
              >
                <RotateCcw className="h-4 w-4" /> Restart
              </button>
              <button
                onClick={() => setSelectedGroup("all")}
                className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--color-panel)] text-[color:var(--color-text)] border border-[color:var(--color-border)] shadow hover:shadow-md px-4 py-2 transition"
              >
                Switch to All
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Question */}
            <div className="text-[color:var(--color-text)] font-medium text-base">
              {idx + 1}. {current.question}
            </div>

            {/* Options */}
            <div className="grid gap-2">
              {current.options.map((opt, i) => {
                const active = picked === i;
                return (
                  <label
                    key={i}
                    className={[
                      "cursor-pointer rounded-xl border px-4 py-2 flex items-center justify-between transition",
                      active
                        ? [
                            "border-transparent",
                            "bg-[color:var(--color-accent)]",
                            "text-[color:var(--color-on-accent)]",
                            "shadow",
                            // shade on hover/press but stay readable
                            "hover:bg-[color:var(--color-accent-weak)]",
                            "active:bg-[color:var(--color-accent-strong)]",
                          ].join(" ")
                        : [
                            "border-[color:var(--color-border)]",
                            "bg-[color:var(--color-panel)]",
                            "text-[color:var(--color-text)]",
                            "hover:bg-[color:var(--color-panel)]/95",
                            "hover:border-[color:var(--color-accent)]/40",
                          ].join(" "),
                    ].join(" ")}
                    onClick={() => setPicked(i)}
                  >
                    <span className="text-sm">{opt}</span>
                    {active ? (
                      <CheckCircle2 className="h-5 w-5 opacity-90" />
                    ) : (
                      <span className="h-5 w-5" />
                    )}
                    {/* Hidden radio to keep semantics */}
                    <input
                      type="radio"
                      name={`opt-${current.id}`}
                      className="hidden"
                      checked={picked === i}
                      onChange={() => setPicked(i)}
                    />
                  </label>
                );
              })}
            </div>

            {/* Submit */}
            <div className="flex items-center justify-between">
              <div className="text-xs text-[color:var(--color-text)]/60">
                Card {idx + 1} of {cards.length}
              </div>
              <button
                type="submit"
                disabled={picked == null}
                className={[
                  "inline-flex items-center gap-2 rounded-xl px-4 py-2 transition shadow-md",
                  picked == null
                    ? "bg-[color:var(--color-panel)] text-[color:var(--color-text)]/50 border border-[color:var(--color-border)] cursor-not-allowed"
                    : "bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)] hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 hover:bg-[color:var(--color-accent-weak)] active:bg-[color:var(--color-accent-strong)]",
                ].join(" ")}
              >
                Submit <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Flashcard;