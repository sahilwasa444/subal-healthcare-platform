/* ============================================
   SUBAL PHARMA — js/cart.js
   Cart page — view, remove, place order
   ============================================ */

document.addEventListener("DOMContentLoaded", () => {
    if (!isLoggedIn()) {
        window.location.href = "login.html";
        return;
    }
    loadCart();
});

/* --------------------------------------------------
   LOAD CART
-------------------------------------------------- */
async function loadCart() {
    const cartContainer = document.getElementById("cartItems");
    const totalEl       = document.getElementById("cartTotal");
    const countEl       = document.getElementById("cartCount");

    cartContainer.innerHTML = `<div class="loading">Loading cart…</div>`;

    try {
        const data  = await apiGetCart();
        const items = data.items || [];

        if (items.length === 0) {
            cartContainer.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">🛒</span>
                    <p>Your cart is empty.</p>
                    <a href="index.html" class="btn-back">Upload Prescription</a>
                </div>`;
            if (totalEl)  totalEl.textContent  = "₹0.00";
            if (countEl)  countEl.textContent  = "0 items";
            return;
        }

        // Calculate total
        const total = items.reduce((sum, item) => {
            const price = item.product?.price || 0;
            return sum + price * (item.quantity || 1);
        }, 0);

        if (countEl) countEl.textContent = `${items.length} item${items.length > 1 ? "s" : ""}`;
        if (totalEl) totalEl.textContent = `₹${total.toFixed(2)}`;

        cartContainer.innerHTML = "";
        items.forEach((item, i) => {
            const product = item.product || {};
            const row = document.createElement("div");
            row.className = "cart-item";
            row.style.animationDelay = (i * 0.06) + "s";
            row.id = `cartItem_${product._id}`;
            row.innerHTML = `
                <div class="cart-item-info">
                    <div class="cart-item-name">${product.brand || product.name || "Medicine"}</div>
                    <div class="cart-item-salt">${product.salt || ""}</div>
                </div>
                <div class="cart-item-qty">Qty: ${item.quantity || 1}</div>
                <div class="cart-item-price">₹${((product.price || 0) * (item.quantity || 1)).toFixed(2)}</div>
                <button class="btn-remove" onclick="removeFromCart('${product._id}')">✕ Remove</button>
            `;
            cartContainer.appendChild(row);
        });

    } catch (err) {
        cartContainer.innerHTML = `<div class="msg-error">❌ ${err.message}</div>`;
    }
}

/* --------------------------------------------------
   REMOVE FROM CART
-------------------------------------------------- */
async function removeFromCart(productId) {
    try {
        await apiRemoveFromCart(productId);
        const el = document.getElementById(`cartItem_${productId}`);
        if (el) {
            el.style.opacity   = "0";
            el.style.transform = "translateX(20px)";
            el.style.transition = "all .3s ease";
            setTimeout(() => { el.remove(); loadCart(); }, 300);
        }
        showToast("🗑️ Item removed from cart.", "success");
    } catch (err) {
        showToast("❌ " + err.message, "error");
    }
}

/* --------------------------------------------------
   PLACE ORDER
-------------------------------------------------- */
async function placeOrder() {
    const btn = document.getElementById("placeOrderBtn");
    btn.disabled    = true;
    btn.textContent = "Placing order…";

    try {
        const data = await apiPlaceOrder();
        showToast("✅ Order placed successfully!", "success");
        setTimeout(() => window.location.href = "orders.html", 1500);
    } catch (err) {
        showToast("❌ " + err.message, "error");
        btn.disabled    = false;
        btn.textContent = "Place Order";
    }
}

/* --------------------------------------------------
   TOAST (standalone for cart page)
-------------------------------------------------- */
function showToast(message, type = "success") {
    document.querySelectorAll(".toast").forEach(t => t.remove());
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    Object.assign(toast.style, {
        position:     "fixed",
        bottom:       "28px",
        right:        "28px",
        background:   type === "success" ? "#0a4f3c" : "#c0392b",
        color:        "#fff",
        padding:      "12px 20px",
        borderRadius: "10px",
        fontSize:     ".9rem",
        fontFamily:   "'DM Sans', sans-serif",
        boxShadow:    "0 6px 24px rgba(0,0,0,.22)",
        zIndex:       "9999",
        transform:    "translateY(20px)",
        opacity:      "0",
        transition:   "all .3s ease",
        maxWidth:     "320px",
    });
    document.body.appendChild(toast);
    requestAnimationFrame(() => { toast.style.transform = "translateY(0)"; toast.style.opacity = "1"; });
    setTimeout(() => {
        toast.style.transform = "translateY(20px)"; toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}
