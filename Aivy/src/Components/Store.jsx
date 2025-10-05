import React from "react";

const Store = () => {
  const items = [
    { id: "s1", name: "Starter Pack", desc: "Extra prompts & quick replies." },
    { id: "s2", name: "Theme: Solar", desc: "Warm, high-contrast theme." },
    { id: "s3", name: "Extra History", desc: "Keep more messages per chat." },
  ];

  return (
    <div className="p-6">
      <h2 className="text-base font-semibold mb-4 text-[color:var(--color-text)]">
        Shop
      </h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <div
            key={it.id}
            className="
              group
              rounded-2xl bg-[color:var(--color-panel)]
              border border-[color:var(--color-border)]
              p-4 shadow
              transition
              hover:shadow-lg hover:-translate-y-0.5
              hover:border-[color:var(--color-accent)]/60
              focus-within:shadow-lg
            "
          >
            <div className="mb-3">
              <div
                className="
                  h-10 w-10 rounded-full grid place-items-center
                  bg-[color:var(--color-accent-weak)]
                  text-[color:var(--color-on-accent)]
                  shadow-sm
                  transition
                  group-hover:shadow-md
                "
              >
                <span className="text-lg">🛍️</span>
              </div>
            </div>

            <div className="font-medium text-[color:var(--color-text)]">
              {it.name}
            </div>
            <p className="text-sm text-[color:var(--color-text)]/70 mt-1">
              {it.desc}
            </p>

            {/* Disabled in demo, but still responds to card hover via group-hover */}
            <button
              disabled
              title="Disabled in demo"
              className="
                mt-3 inline-flex items-center rounded-xl px-3 py-1.5 text-sm
                bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)]
                cursor-not-allowed shadow-sm
                opacity-90
                transition
                group-hover:bg-[color:var(--color-accent-weak)]
                group-hover:shadow-md
              "
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