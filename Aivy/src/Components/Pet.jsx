// import React from "react";

// export const Pet = () => {
//   return <div>Pet</div>;
// };


// src/Components/Pet.jsx
import React, { useState } from "react";

/**
 * Simple virtual pet demo.
 * Props:
 *  - points: number (read-only display)
 *  - onEarn: (amount:number) => void  // call to increase global points
 */
const Pet = ({ points = 0, onEarn = () => {} }) => {
  const [hunger, setHunger] = useState(50);    // 0 = full, 100 = starving
  const [happy, setHappy] = useState(60);      // 0..100

  const clamp = (v) => Math.max(0, Math.min(100, v));

  const feed = () => {
    setHunger((h) => clamp(h - 15));
    setHappy((h) => clamp(h + 5));
    onEarn(2); // earn 2 points
  };

  const play = () => {
    setHappy((h) => clamp(h + 10));
    setHunger((h) => clamp(h + 5)); // playing makes it a bit hungry
    onEarn(3); // earn 3 points
  };

  const reset = () => {
    setHunger(50);
    setHappy(60);
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <h2 className="text-base font-semibold mb-4">Pet</h2>

      <div className="flex items-center gap-4">
        <div className="text-5xl">🐣</div>
        <div className="text-sm text-neutral-600 dark:text-neutral-400">
          <div>Hunger: {hunger}/100</div>
          <div>Happy: {happy}/100</div>
          <div className="mt-1">Your points: <span className="font-semibold">{points}</span></div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={feed}
          className="rounded-md bg-black text-white dark:bg-white dark:text-black px-3 py-1.5 text-sm"
        >
          Feed (+2 pts)
        </button>
        <button
          onClick={play}
          className="rounded-md border dark:border-neutral-800 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          Play (+3 pts)
        </button>
        <button
          onClick={reset}
          className="rounded-md px-3 py-1.5 text-sm border dark:border-neutral-800"
        >
          Reset
        </button>
      </div>

      <div className="mt-6 text-xs text-neutral-500">
        Actions here only affect local state and your demo point balance.
      </div>
    </div>
  );
};

export default Pet;
