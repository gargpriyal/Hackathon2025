import React, { useState, useEffect } from "react";

const API_BASE = "http://127.0.0.1:8000";
const userId = "68e1f7697d8c1deff631e9ba";

const Pet = ({ points = 0, onEarn = () => {} }) => {
  const [petId, setPetId] = useState(null);
  const [energy, setEnergy] = useState(50);
  const [happiness, setHappiness] = useState(60);
  const [petName, setPetName] = useState("Your Pet");
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingInventory, setLoadingInventory] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch pet and inventory sequentially
  const fetchData = async () => {
    setLoading(true);
    setLoadingInventory(true);
    try {
      // Fetch pet
      const petRes = await fetch(
        `${API_BASE}/pets?userId=${encodeURIComponent(userId)}`
      );
      if (!petRes.ok) throw new Error(`Failed to fetch pets: ${petRes.status}`);
      const petData = await petRes.json();
      if (petData.pets?.length > 0) {
        const pet = petData.pets[0];
        if (pet.energyLevel !== undefined) setEnergy(pet.energyLevel);
        if (pet.happinessLevel !== undefined) setHappiness(pet.happinessLevel);
        setPetId(pet._id);
        if (pet.name) setPetName(pet.name);
      }

      // Fetch inventory
      const invRes = await fetch(
        `${API_BASE}/inventory?userId=${encodeURIComponent(userId)}`
      );
      if (!invRes.ok)
        throw new Error(`Failed to fetch inventory: ${invRes.status}`);
      const invData = await invRes.json();
      setInventory(invData.inventory || []);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
      setLoadingInventory(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // const clamp = (v) => Math.max(0, Math.min(100, v));


  // const play = () => {
  //   setEnergy((e) => clamp(e +5));
  // };
  // Handle selecting an inventory item
  const handleSelectItem = async (entry) => {
    if (!entry.item) return;

    const itemType = entry.item.itemType;
    let endpoint = null;

    if (itemType === "FOOD") endpoint = "feed";
    else if (itemType === "TOYS") endpoint = "play";
    else return; // CLOTHING → do nothing

    setActionLoading(true);

    try {
      const res = await fetch(`${API_BASE}/pets/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          petId: petId,
          itemId: entry.item._id,
        }),
      });
      if (!res.ok) throw new Error(`Failed to ${endpoint} pet: ${res.status}`);
      const data = await res.json();
      console.log(`${endpoint} response:`, data);

      // Update pet stats locally
      if (itemType === "FOOD") setEnergy(data.energyLevel);
      else if (itemType === "TOYS") setHappiness(data.happinessLevel);

      // Refetch inventory after using item
      await fetchData();
    } catch (err) {
      console.error(`Error using item: ${err}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Group inventory by category
  const groupedInventory = inventory.reduce((acc, entry) => {
    const cat = entry.item?.itemType || "Misc";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(entry);
    return acc;
  }, {});

  if (loading)
    return (
      <div className="p-6 text-sm text-neutral-500">Loading pet stats...</div>
    );

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top: Pet */}
      <div className="flex-1 p-6 border-b border-neutral-200">
        <h2 className="text-base font-semibold mb-4">{petName}</h2>
        <div className="flex items-center gap-4">
          <div className="text-5xl">🐣</div>
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            <div>Energy: {energy}/100</div>
            <div>Happiness: {happiness}/100</div>
            <div className="mt-1">
              Your points: <span className="font-semibold">{points}</span>
            </div>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
        </div>
      </div>

      {/* Bottom: Inventory */}
      <div className="flex-1 p-6 overflow-y-auto">
        <h2 className="text-base font-semibold mb-4">Inventory</h2>
        {loadingInventory ? (
          <div className="text-sm text-neutral-500">Loading inventory...</div>
        ) : inventory.length === 0 ? (
          <div className="text-sm text-neutral-400">
            Your inventory is empty.
          </div>
        ) : (
          Object.entries(groupedInventory).map(([category, items]) => (
            <div key={category} className="mb-8">
              <h3 className="text-sm font-medium text-neutral-700 mb-3">
                {category}
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {items.map((entry) => (
                  <div
                    key={entry.inventoryId}
                    className="rounded-xl border border-neutral-200 shadow-sm p-4 flex flex-col items-center justify-center text-sm"
                  >
                    <div className="text-3xl mb-2">
                      {entry.item?.emoji || "📦"}
                    </div>
                    <div className="font-medium text-neutral-800">
                      {entry.item?.name || "Unknown"}
                    </div>
                    <div className="text-xs text-neutral-500 mt-1">
                      x{entry.quantity}
                    </div>
                    <button
                      onClick={() => handleSelectItem(entry)}
                      disabled={
                        actionLoading ||
                        !["FOOD", "TOYS"].includes(entry.item?.itemType)
                      }
                      className={`mt-2 px-2 py-1 text-xs rounded ${
                        ["FOOD", "TOYS"].includes(entry.item?.itemType)
                          ? "bg-green-600 text-white"
                          : "bg-gray-300 text-gray-600 cursor-not-allowed"
                      }`}
                    >
                      Select
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Pet;
