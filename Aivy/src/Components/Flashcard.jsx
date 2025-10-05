// src/Components/Flashcard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Loader2, ChevronRight, RotateCcw, CheckCircle2, XCircle } from "lucide-react";

const API_BASE = "http://127.0.0.1:8787";

const Flashcard = ({ groups = [{ id: "g-all", name: "All" }], onEarn }) => {
  // Map your app's groups into backend keys (all/work/personal/...)
  const groupOptions = useMemo(() => {
    const base = [{ key: "all", label: "All" }];
    const rest = (groups || [])
      .map((g) => ({ key: (g.name || "").toLowerCase(), label: g.name }))
      // dedupe and drop "all" duplicates
      .filter((g) => g.key && g.key !== "all");
    // Avoid duplicate labels
    const seen = new Set();
    const merged = [...base, ...rest].filter((g) => {
      const k = g.key;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    return merged;
  }, [groups]);

  const [selectedGroup, setSelectedGroup] = useState("all");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [cards, setCards] = useState([]); // [{id,question,options,correctIndex}]
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null); // number | null
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
    // move to next
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
        <h2 className="text-lg font-semibold text-slate-800">Flashcards</h2>
        <div className="flex items-center gap-2">
          <label htmlFor="group" className="text-sm text-slate-500">
            Group
          </label>
          <select
            id="group"
            className="rounded-lg bg-white border border-slate-200 shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
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
      <div className="bg-white border border-slate-200 rounded-2xl shadow p-5">
        {loading ? (
          <div className="flex items-center gap-2 text-slate-600">
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
            <div className="text-slate-800 font-semibold text-lg mb-1">All done!</div>
            <div className="text-slate-600 mb-4">
              Total score change:{" "}
              <span className={totalDelta >= 0 ? "text-emerald-600" : "text-rose-600"}>
                {totalDelta >= 0 ? "+" : ""}
                {totalDelta}
              </span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={handleRestart}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white shadow-md hover:shadow-lg px-4 py-2 transition"
              >
                <RotateCcw className="h-4 w-4" /> Restart
              </button>
              <button
                onClick={() => setSelectedGroup("all")}
                className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 shadow hover:shadow-md px-4 py-2 transition"
              >
                Switch to All
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Question */}
            <div className="text-slate-900 font-medium text-base">
              {idx + 1}. {current.question}
            </div>

            {/* Options */}
            <div className="grid gap-2">
              {current.options.map((opt, i) => {
                const active = picked === i;
                return (
                  <label
                    key={i}
                    className={`cursor-pointer rounded-xl border px-4 py-2 flex items-center justify-between transition
                      ${
                        active
                          ? "border-slate-900 bg-slate-900 text-white shadow"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                  >
                    <span className="text-sm">{opt}</span>
                    <input
                      type="radio"
                      name={`opt-${current.id}`}
                      className="hidden"
                      checked={picked === i}
                      onChange={() => setPicked(i)}
                    />
                    {active ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <XCircle className="h-5 w-5 opacity-0" />
                    )}
                  </label>
                );
              })}
            </div>

            {/* Submit */}
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-500">
                Card {idx + 1} of {cards.length}
              </div>
              <button
                type="submit"
                disabled={picked == null}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 transition shadow-md
                  ${
                    picked == null
                      ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                      : "bg-slate-900 text-white hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                  }`}
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
