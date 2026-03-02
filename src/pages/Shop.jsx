import "../styles/Shop.scss";
import React from "react";

const shopItems = [
  { id: "platinum", name: "Platinum", cost: 35, icon: "🖥️" },
  { id: "basic", name: "Basic", cost: 25, icon: "📺" },
  { id: "deluxe", name: "Deluxe", cost: 100, icon: "💻" },
  { id: "ultra", name: "Ultra", cost: 120, icon: "🖲️" },
];

function Shop() {
  return (
    <div className="Shop_Style">
      <div className="shop-container">
        <h2>Buy Item</h2>
        <div className="shop-grid">
          {shopItems.map((item) => (
            <article key={item.id} className="shop-card">
              <div className="item-cost">◇ {item.cost}</div>
              <div className="item-icon" aria-hidden="true">
                {item.icon}
              </div>
              <div className="item-name">{item.name}</div>
              <button className="item-buy" type="button">
                Buy
              </button>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Shop;
