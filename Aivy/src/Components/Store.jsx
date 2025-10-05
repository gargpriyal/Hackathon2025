import React, { useEffect, useState } from "react";

const API_BASE = "http://127.0.0.1:8000";
const USER_ID = "68e1f7697d8c1deff631e9ba"; // hardcoded

const Store = ({setPoints}) => {
  const [itemsByCategory, setItemsByCategory] = useState({
    FOOD: [],
    CLOTHING: [],
    TOYS: [],
  });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await fetch(`${API_BASE}/items`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        // Expecting data: { FOOD: [...], CLOTHING: [...], TOYS: [...] }
        setItemsByCategory({
          FOOD: data.FOOD || [],
          CLOTHING: data.CLOTHING || [],
          TOYS: data.TOYS || [],
        });
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  const handlePurchase = async (item) => {
    try {
      const res = await fetch(`${API_BASE}/inventory/purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: USER_ID,
          itemId: item._id,
          quantity: 1,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        alert(`Purchase failed: ${errorData.detail || res.status}`);
        return;
      }

      const data = await res.json();
      // alert(`Purchase successful! Remaining coins: ${data.remaining_coins}`);
      setPoints(data.remaining_coins);


      // optional: call a callback to update points in parent
      if (onPurchase) onPurchase(data.remaining_coins);
    } catch (e) {
      console.error("Purchase error:", e);
    }
  };

  if (loading) return <div className="p-6">Loading items…</div>;
  if (err) return <div className="p-6 text-red-600">Error: {err}</div>;

  const categories = [
    { key: "FOOD", label: "Food" },
    { key: "CLOTHING", label: "Clothing" },
    { key: "TOYS", label: "Toys" },
  ];

  return (
    <div className="p-6">
      <h2 className="text-base font-semibold mb-4 text-[color:var(--color-text)]">Shop</h2>
      <div className="grid gap-6 sm:grid-cols-3">
        {categories.map((cat) => (
          <div key={cat.key}>
            <h3 className="font-semibold mb-3">{cat.label}</h3>
            <div className="space-y-4">
              {itemsByCategory[cat.key].map((it) => (
                <div
                  key={it._id}
                  className="group
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
                    <div className="h-10 w-10 rounded-full grid place-items-center
                  bg-[color:var(--color-accent-weak)]
                  text-[color:var(--color-on-accent)]
                  shadow-sm
                  transition
                  group-hover:shadow-md
                ">
                      <span className="text-lg">🛍️</span>
                    </div>
                  </div>
                  <div className="font-medium text-[color:var(--color-text)]">{it.name}</div>
                  {it.desc && (
                    <p className="text-sm text-[color:var(--color-text)]/70 mt-1">
                      {it.desc}
                    </p>
                  )}
                  <div className="text-sm text-[color:var(--color-text)]/70 mt-1">
                      Price: {it.price}
                  </div>
                  <button
                    onClick={() => handlePurchase(it)}
                   className="
                mt-3 inline-flex items-center rounded-xl px-3 py-1.5 text-sm
                bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)]
                cursor-not-allowed shadow-sm
                opacity-90
                transition
                group-hover:bg-[color:var(--color-accent-weak)]
                group-hover:shadow-md
              "
                    title="Purchase item"
                  >
                    Buy
                  </button>
                </div>
              ))}
              {itemsByCategory[cat.key].length === 0 && (
                <div className="text-sm text-slate-500">
                  No items in this category
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Store;