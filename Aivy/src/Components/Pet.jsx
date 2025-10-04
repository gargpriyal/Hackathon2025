import React, { useEffect, useState } from "react";

const API = "http://localhost:8000";

export default function PetPage() {
  const username = "alice";
  const [pet, setPet] = useState({ pet_happiness: 50 });
  const [inventory, setInventory] = useState([]);

  useEffect(() => {
    fetch(`${API}/pet/${username}`)
      .then((res) => res.json())
      .then(setPet);

    setInventory(mockInventory);
  }, []);

  const getItemsByCategory = (category) =>
    inventory.filter(
      (item) => item.category.toLowerCase() === category.toLowerCase()
    );

  // mockInventory.js
  const mockInventory = [
    {
      id: 1,
      name: "Apple",
      picture: "/items/apple.jpg",
      category: "food",
      price: 5,
    },
    {
      id: 2,
      name: "Bone Toy",
      picture: "/items/bone.jpg",
      category: "toy",
      price: 15,
    },
    {
      id: 3,
      name: "Red Shirt",
      picture: "/items/red-shirt.jpg",
      category: "clothes",
      price: 25,
    },
    {
      id: 4,
      name: "Fish Snack",
      picture: "/items/fish.jpg",
      category: "food",
      price: 10,
    },
    {
      id: 5,
      name: "Soccer Ball",
      picture: "/items/ball.jpg",
      category: "toy",
      price: 20,
    },
    {
      id: 6,
      name: "Blue Hoodie",
      picture: "/items/blue-hoodie.jpg",
      category: "clothes",
      price: 30,
    },
  ];

  const getPetImage = () => {
    if (pet.pet_happiness >= 80) return "/sprites/pet_happy.png";
    if (pet.pet_happiness >= 40) return "/sprites/pet_neutral.png";
    return "/sprites/pet_sad.png";
  };

  return (
    <div className="min-h-screen p-6 flex flex-col items-center justify-center">
      {/* Title */}
      <div className="w-full">
        <h1
          style={{ width: "100%", textAlign: "center", margin: 0 }}
          className="text-3xl font-bold tinos-regular"
        >
          Your Pet
        </h1>
      </div>
      {/* Pet Image */}
      <div className="w-60 h-60 flex items-center justify-center mb-4">
        <img
          src={getPetImage()}
          alt="Pet"
          className="w-full h-full object-contain"
        />
      </div>
      <p className="mb-6 text-lg">Happiness: {pet.pet_happiness}</p>

      {/* Inventory */}
      <h2 className="text-xl mb-3">Inventory</h2>

      {/* Three columns: Food | Clothes | Toys */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/** Define the three displayed categories and which item categories they accept **/}
        {[
          { id: "food", title: "Food", cats: ["food"] },
          { id: "clothes", title: "Clothes", cats: ["shirt", "clothes"] },
          { id: "toys", title: "Toys", cats: ["toy", "toys"] },
        ].map((col) => {
          const items = mockInventory.filter((it) =>
            col.cats.includes((it.category || "").toLowerCase())
          );

          return (
            <div key={col.id} className="border rounded-lg p-3 bg-white">
              <h3 className="font-semibold mb-2 text-center">{col.title}</h3>
              {items.length === 0 ? (
                <p className="text-sm text-gray-500 text-center">No items</p>
              ) : (
                <div className="flex flex-wrap gap-2 justify-center">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="cursor-pointer border p-2 rounded-lg hover:bg-gray-50 flex flex-col items-center w-24"
                    >
                      <img
                        src={item.picture || item.icon || `/items/${item.id}.jpg`}
                        alt={item.name}
                        className="w-12 h-12 mb-1 object-contain"
                      />
                      <p className="text-sm text-center">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.price} coins</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
