document.addEventListener("DOMContentLoaded", () => {
    if (!isLoggedIn()) {
        window.location.href = "login.html";
        return;
    }
    loadOrders();
});

function logout() {
    removeToken();
    window.location.href = "login.html";
}

async function loadOrders() {
    const listEl = document.getElementById("ordersList");
    const countEl = document.getElementById("orderCount");

    listEl.innerHTML = `<div class="loading">Loading orders...</div>`;

    try {
        const data = await apiGetOrders();
        const orders = data.orders || [];

        if (countEl) {
            countEl.textContent = `${orders.length} order${orders.length === 1 ? "" : "s"}`;
        }

        if (!orders.length) {
            listEl.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">📦</span>
                    <p>No orders yet.</p>
                    <a href="index.html" class="btn-back">Start Shopping</a>
                </div>
            `;
            return;
        }

        listEl.innerHTML = "";
        orders.forEach((order, i) => {
            const itemCount = Array.isArray(order.items) ? order.items.length : 0;
            const placedAt = order.createdAt ? new Date(order.createdAt).toLocaleString() : "N/A";
            const finalAmount = typeof order.finalAmount === "number" ? order.finalAmount.toFixed(2) : "0.00";

            const card = document.createElement("div");
            card.className = "cart-item";
            card.style.animationDelay = `${i * 0.06}s`;
            card.innerHTML = `
                <div class="cart-item-info">
                    <div class="cart-item-name">Order #${(order._id || "").slice(-8).toUpperCase()}</div>
                    <div class="cart-item-salt">${placedAt}</div>
                </div>
                <div class="cart-item-qty">${itemCount} item${itemCount === 1 ? "" : "s"}</div>
                <div class="cart-item-price">Rs ${finalAmount}</div>
                <div class="results-count">${order.orderStatus || "placed"}</div>
            `;
            listEl.appendChild(card);
        });
    } catch (err) {
        listEl.innerHTML = `<div class="msg-error">Failed to load orders: ${err.message}</div>`;
    }
}
