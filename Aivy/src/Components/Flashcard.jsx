import React, { useEffect, useState } from "react";

function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const Flashcard = () => {
  const [cards, setCards] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    // Mock data (would come from API in future)
    const mock = [
      {
        question: "What is the capital of France?",
        options: ["Berlin", "London", "Paris", "Madrid"],
        correctAnswer: 2,
      },
      {
        question: "Which planet is known as the Red Planet?",
        options: ["Earth", "Mars", "Jupiter", "Venus"],
        correctAnswer: 1,
      },
      {
        question: "Which language runs in a web browser?",
        options: ["Python", "C++", "JavaScript", "Rust"],
        correctAnswer: 2,
      },
      {
        question: "What does CSS stand for?",
        options: [
          "Computer Style Sheets",
          "Cascading Style Sheets",
          "Creative Style System",
          "Colorful Style Sheets",
        ],
        correctAnswer: 1,
      },
    ];

    // Randomize flashcard order for each session
    setCards(shuffleArray(mock));
  }, []);

  const handleSelect = (idx) => {
    if (answered) return; // ignore after already answered
    setSelected(idx);
    setAnswered(true);
    const card = cards[current];
    if (card && idx === card.correctAnswer) setScore((s) => s + 1);
  };

  const handleNext = () => {
    setSelected(null);
    setAnswered(false);
    setCurrent((c) => c + 1);
  };

  const handleRestart = () => {
    setScore(0);
    setSelected(null);
    setAnswered(false);
    setCurrent(0);
    setCards((prev) => shuffleArray(prev));
  };

  if (cards.length === 0) return <div>Loading flashcards...</div>;

  if (current >= cards.length) {
    return (
      <div className="max-w-xl mx-auto p-4 text-center">
        <h2 className="text-2xl font-semibold mb-4">All done!</h2>
        <p className="mb-4">
          You scored {score} out of {cards.length}.
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={handleRestart}
            className="px-4 py-2 bg-blue-600 text-white rounded-md"
          >
            Restart
          </button>
        </div>
      </div>
    );
  }

  const card = cards[current];

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="border rounded-lg p-6 shadow-sm bg-white">
        <div className="mb-4">
          <h3 className="text-lg font-medium">
            Question {current + 1} of {cards.length}
          </h3>
          <p className="mt-2 text-gray-800">{card.question}</p>
        </div>

        <ul className="list-none p-0 m-0" style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: 12 }}>
          {card.options.map((opt, idx) => {
            const neutralBorder = '#e5e7eb';
            const neutralBg = '#ffffff';
            const correctBg = '#ecfdf5'; // green-50
            const correctBorder = '#34d399'; // green-400
            const wrongBg = '#fee2e2'; // red-50
            const wrongBorder = '#f87171'; // red-400

            const style = {
              border: `1px solid ${neutralBorder}`,
              borderRadius: 8,
              padding: 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: neutralBg,
            };

            if (answered) {
              if (idx === card.correctAnswer) {
                style.background = correctBg;
                style.border = `1px solid ${correctBorder}`;
              }
              if (selected === idx && idx !== card.correctAnswer) {
                style.background = wrongBg;
                style.border = `1px solid ${wrongBorder}`;
              }
            }

            return (
              <li
                key={idx}
                style={style}
                onClick={() => handleSelect(idx)}
                role="button"
                aria-pressed={selected === idx}
              >
                <input
                  type="radio"
                  name="flashcard"
                  checked={selected === idx}
                  readOnly
                  style={{ width: 16, height: 16 }}
                />
                <span style={{ fontSize: 14 }}>{opt}</span>
              </li>
            );
          })}
        </ul>

        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">Score: {score}</div>
          <div>
            <button
              onClick={handleNext}
              disabled={!answered}
              className={`px-4 py-2 rounded-md text-white ${
                answered ? "bg-blue-600" : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Flashcard;
