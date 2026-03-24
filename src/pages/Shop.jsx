import "../styles/Shop.scss";
import React, { useEffect, useState } from "react";
import { getCurrentSession, onAuthStateChange } from "../lib/authentication";
import { supabase } from "../lib/supabaseClient";

const shopItems = [
  { id: "platinum", name: "Platinum", cost: 35, icon: "🖥️" },
  { id: "basic", name: "Basic", cost: 25, icon: "📺" },
  { id: "deluxe", name: "Deluxe", cost: 100, icon: "💻" },
  { id: "ultra", name: "Ultra", cost: 120, icon: "🖲️" },
];

function isMissingColumnError(error, tableName, columnName) {
  const message = (error?.message || "").toLowerCase();
  return message.includes(tableName) && message.includes(columnName) && message.includes("does not exist");
}

async function loadHoneycombBalance(userId, setBalance) {
  const { data, error } = await supabase
    .from("profiles")
    .select("honeycomb")
    .eq("id", userId)
    .single();
  if (!error) {
    setBalance(data?.honeycomb ?? 0);
    return;
  }

  if (!isMissingColumnError(error, "profiles", "honeycomb")) {
    setBalance(0);
    return;
  }

  const { data: legacyData } = await supabase
    .from("profiles")
    .select("points")
    .eq("id", userId)
    .single();

  setBalance(legacyData?.points ?? 0);
}

async function ensureProfileRow(userId) {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("profiles")
    .upsert({ id: userId, honeycomb: 0, updated_at: now }, { onConflict: "id" });

  if (!error) {
    return "honeycomb";
  }

  if (!isMissingColumnError(error, "profiles", "honeycomb")) {
    throw error;
  }

  const { error: legacyError } = await supabase
    .from("profiles")
    .upsert({ id: userId, points: 0, updated_at: now }, { onConflict: "id" });

  if (legacyError) {
    throw legacyError;
  }

  return "points";
}

async function loadUserBalance(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("honeycomb")
    .eq("id", userId)
    .single();

  if (!error) {
    return { balance: data?.honeycomb ?? 0, column: "honeycomb" };
  }

  if (error?.code === "PGRST116") {
    const column = await ensureProfileRow(userId);
    return { balance: 0, column };
  }

  if (!isMissingColumnError(error, "profiles", "honeycomb")) {
    throw error;
  }

  const { data: legacyData, error: legacyError } = await supabase
    .from("profiles")
    .select("points")
    .eq("id", userId)
    .single();

  if (legacyError?.code === "PGRST116") {
    await ensureProfileRow(userId);
    return { balance: 0, column: "points" };
  }

  if (legacyError) {
    throw legacyError;
  }

  return { balance: legacyData?.points ?? 0, column: "points" };
}

async function saveUserBalance(userId, nextTotal, column) {
  const { error } = await supabase
    .from("profiles")
    .update({
      [column]: nextTotal,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    throw error;
  }
}

function Shop() {
  const [honeycombBalance, setHoneycombBalance] = useState(0);
  const [cart, setCart] = useState([]);
  const [checkoutMessage, setCheckoutMessage] = useState(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotalCost = cart.reduce((sum, item) => sum + item.quantity * item.cost, 0);

  useEffect(() => {
    let isMounted = true;

    async function init() {
      const session = await getCurrentSession();
      if (!isMounted) return;
      const userId = session?.user?.id;
      if (!userId) {
        setHoneycombBalance(0);
        return;
      }
      await loadHoneycombBalance(userId, setHoneycombBalance);
    }

    init();

    const { data: { subscription } } = onAuthStateChange(async (nextSession) => {
      if (!isMounted) return;
      const userId = nextSession?.user?.id;
      if (!userId) {
        setHoneycombBalance(0);
        return;
      }
      await loadHoneycombBalance(userId, setHoneycombBalance);
    });

    const handleHoneycombUpdated = async (event) => {
      const userId = event?.detail?.userId || (await getCurrentSession())?.user?.id;
      if (!userId) return;
      if (typeof event?.detail?.newTotal === "number") {
        setHoneycombBalance(event.detail.newTotal);
        return;
      }
      await loadHoneycombBalance(userId, setHoneycombBalance);
    };

    window.addEventListener("honeycomb-updated", handleHoneycombUpdated);

    return () => {
      isMounted = false;
      window.removeEventListener("honeycomb-updated", handleHoneycombUpdated);
      subscription.unsubscribe();
    };
  }, []);

  const handleAddToCart = (item) => {
    setCheckoutMessage(null);
     setIsCartOpen(true);
    setCart((prev) => {
      const existing = prev.find((entry) => entry.id === item.id);
      if (existing) {
        return prev.map((entry) =>
          entry.id === item.id ? { ...entry, quantity: entry.quantity + 1 } : entry,
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const handleRemoveFromCart = (id) => {
    setCheckoutMessage(null);
    setCart((prev) => prev.filter((entry) => entry.id !== id));
  };

  const handleClearCart = () => {
    setCheckoutMessage(null);
    setCart([]);
  };

  const handleCheckout = async () => {
    setCheckoutMessage(null);
    if (cart.length === 0) {
      setCheckoutMessage({ type: "error", text: "Your cart is empty." });
      return;
    }

    setIsCheckingOut(true);
    try {
      const session = await getCurrentSession();
      const userId = session?.user?.id;
      if (!userId) {
        setCheckoutMessage({ type: "error", text: "You need to be signed in to checkout." });
        return;
      }

      const { balance, column } = await loadUserBalance(userId);
      const total = cart.reduce((sum, item) => sum + item.quantity * item.cost, 0);

      if (total > balance) {
        setCheckoutMessage({
          type: "error",
          text: `Not enough honeycombs. You have ${balance}, but your cart costs ${total}.`,
        });
        return;
      }

      const nextTotal = balance - total;
      await saveUserBalance(userId, nextTotal, column);

      window.dispatchEvent(
        new CustomEvent("honeycomb-updated", {
          detail: {
            userId,
            newTotal: nextTotal,
          },
        }),
      );

      setHoneycombBalance(nextTotal);
      setCart([]);
      setCheckoutMessage({
        type: "success",
        text: "Purchase complete! Your items have been purchased.",
      });
    } catch (error) {
      setCheckoutMessage({
        type: "error",
        text: error?.message || "Could not complete checkout. Please try again.",
      });
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="Shop_Style">
      <div className="shop-container">
        <div className="shop-header">
          <div className="shop-header-main">
            <h2>Buy Item</h2>
            <p className="shop-honeycombs" aria-live="polite">
              Honeycombs earned: <strong>{honeycombBalance}</strong>
            </p>
          </div>
          <button
            type="button"
            className="shop-cart-toggle"
            onClick={() => setIsCartOpen((open) => !open)}
            aria-expanded={isCartOpen}
            aria-label={isCartOpen ? "Hide cart" : "Show cart"}
          >
            <span className="shop-cart-toggle-icon" aria-hidden="true">
              🛒
            </span>
            <span className="shop-cart-toggle-count">{cartItemCount}</span>
          </button>
        </div>
        <div className="shop-content">
          <div className="shop-grid">
            {shopItems.map((item) => (
              <article key={item.id} className="shop-card">
                <div className="item-cost">◇ {item.cost}</div>
                <div className="item-icon" aria-hidden="true">
                  {item.icon}
                </div>
                <div className="item-name">{item.name}</div>
                <button
                  className="item-buy"
                  type="button"
                  onClick={() => handleAddToCart(item)}
                >
                  Add to cart
                </button>
              </article>
            ))}
          </div>
        </div>
        {isCartOpen && (
          <aside className="shop-cart-panel" aria-label="Cart">
            <h3 className="shop-cart-title">Cart</h3>
            <p className="shop-cart-meta">
              Items: <strong>{cartItemCount}</strong> • Total:{" "}
              <strong>{cartTotalCost}</strong>
            </p>
            <p className="shop-cart-meta">
              Honeycombs available: <strong>{honeycombBalance}</strong>
            </p>

            <div className="shop-cart-items">
              {cart.length === 0 ? (
                <p className="shop-cart-empty">Your cart is empty.</p>
              ) : (
                cart.map((entry) => (
                  <div key={entry.id} className="shop-cart-row">
                    <div className="shop-cart-row-main">
                      <span className="shop-cart-row-name">{entry.name}</span>
                      <span className="shop-cart-row-qty">x{entry.quantity}</span>
                    </div>
                    <div className="shop-cart-row-meta">
                      <span className="shop-cart-row-cost">
                        {entry.cost * entry.quantity} hc
                      </span>
                      <button
                        type="button"
                        className="shop-cart-remove"
                        onClick={() => handleRemoveFromCart(entry.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {checkoutMessage && (
              <p
                className={
                  checkoutMessage.type === "success"
                    ? "shop-cart-message shop-cart-message--success"
                    : "shop-cart-message shop-cart-message--error"
                }
              >
                {checkoutMessage.text}
              </p>
            )}

            <div className="shop-cart-actions">
              <button
                type="button"
                className="shop-cart-button shop-cart-button--primary"
                onClick={handleCheckout}
                disabled={cart.length === 0 || isCheckingOut}
              >
                {isCheckingOut ? "Checking out…" : "Checkout"}
              </button>
              <button
                type="button"
                className="shop-cart-button shop-cart-button--ghost"
                onClick={handleClearCart}
                disabled={cart.length === 0 || isCheckingOut}
              >
                Clear
              </button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

export default Shop;
