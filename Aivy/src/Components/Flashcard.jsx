import { Loader2, ChevronRight, RotateCcw, CheckCircle2, XCircle } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

const API_BASE = "http://127.0.0.1:8000"; // adjust if needed

const Flashcard = ({ setPoints, setStreak }) => {
  const [cards, setCards] = useState([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [totalDelta, setTotalDelta] = useState(0);

  const current = cards[idx];

  // Fetch flashcards on mount
  useEffect(() => {
    const fetchCards = async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await fetch(`${API_BASE}/flashcards`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!Array.isArray(data.flashcards)) throw new Error("Invalid data format");
        setCards(data.flashcards);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCards();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!current || picked === null) return;

    try {
      const res = await fetch(`${API_BASE}/users/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: '68e1f7697d8c1deff631e9ba',
          flashcardId: current._id,
          optionSelected: picked,
        }),
      });

      const answerData = await res.json();
      setPoints(answerData.coins)
      setStreak(answerData.streak)

      const correct = answerData.result === "correct";
      const delta = correct ? 3 : -1;
      setTotalDelta((d) => d + delta);

      setPicked(null);
      setIdx((i) => i + 1);
    } catch (e) {
      console.error("Error sending answer:", e);
    }
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

            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Question */}
            <div className="text-[color:var(--color-text)] font-medium text-base">
              {idx + 1}. {current.question}
            </div>

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
                      name={`opt-${current._id}`}
                      className="hidden"
                      checked={picked === i}
                      onChange={() => setPicked(i)}
                    />
                    {active ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5 opacity-0" />}
                  </label>
                );
              })}
            </div>

            <div className="flex items-center justify-between">
              <div className="text-xs text-[color:var(--color-text)]/60">
                Card {idx + 1} of {cards.length}
              </div>
              <button
                type="submit"
                disabled={picked === null}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 transition shadow-md
                  ${
                    picked === null
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