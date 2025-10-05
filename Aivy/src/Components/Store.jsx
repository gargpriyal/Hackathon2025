// import React from 'react'

// export const Store = () => {
//   return (
//     <div>Store</div>
//   )
// }


// src/Components/Store.jsx
import React from "react";

const Store = () => {
  const items = [
    { id: "s1", name: "Starter Pack", desc: "Extra prompts & quick replies." },
    { id: "s2", name: "Theme: Solar", desc: "Warm, high-contrast theme." },
    { id: "s3", name: "Extra History", desc: "Keep more messages per chat." },
  ];

  return (
    <div className="p-6">
      <h2 className="text-base font-semibold mb-4">Shop</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <div
            key={it.id}
            className="rounded-xl border dark:border-neutral-800 p-4 bg-white dark:bg-neutral-900"
          >
            <div className="mb-3">
              <div className="h-10 w-10 rounded-full bg-yellow-200 grid place-items-center">
                <span className="text-lg">🛍️</span>
              </div>
            </div>
            <div className="font-medium">{it.name}</div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{it.desc}</p>
            <button
              disabled
              className="mt-3 rounded-md bg-neutral-200 text-neutral-600 px-3 py-1.5 text-sm cursor-not-allowed"
              title="Disabled in demo"
            >
              Buy
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Store;
