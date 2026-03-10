/* ============================================
   SUBAL PHARMA — js/api.js
   Base URLs + All API helper functions
   ============================================ */

   // FastAPI / ML backend
const NODE_BASE_URL = "http://localhost:5000";     // Node.js / Express backend

/* --------------------------------------------------
   AUTH HELPERS
-------------------------------------------------- */
function getToken() {
    return localStorage.getItem("token");
}

function setToken(token) {
    localStorage.setItem("token", token);
}

function removeToken() {
    localStorage.removeItem("token");
}

function isLoggedIn() {
    return !!getToken();
}

/* --------------------------------------------------
   AUTH — LOGIN
-------------------------------------------------- */
async function apiLogin(email, password) {
    const response = await fetch(`${NODE_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Login failed");
    return data;   // { token, user }
}

/* --------------------------------------------------
   AUTH — REGISTER
-------------------------------------------------- */
async function apiRegister(name, email, password) {
    const response = await fetch(`${NODE_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Registration failed");
    return data;
}

/* --------------------------------------------------
   PRESCRIPTION — UPLOAD & PREDICT
-------------------------------------------------- */
async function apiUploadPrescription(file) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${NODE_BASE_URL}/predict`, {
        method: "POST",
        body: formData
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Prediction failed");
    return data;   // { matched_drugs: [...], unmatched_words: [...] }
}

/* --------------------------------------------------
   CART — ADD ITEM
-------------------------------------------------- */
async function apiAddToCart(productId, quantity = 1) {
    const response = await fetch(`${NODE_BASE_URL}/api/cart/add`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${getToken()}`
        },
        body: JSON.stringify({ productId, quantity })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to add to cart");
    return data;
}

/* --------------------------------------------------
   CART — GET CART
-------------------------------------------------- */
async function apiGetCart() {
    const response = await fetch(`${NODE_BASE_URL}/api/cart`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${getToken()}`
        }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to fetch cart");
    return data;   // { items: [...] }
}

/* --------------------------------------------------
   CART — REMOVE ITEM
-------------------------------------------------- */
async function apiRemoveFromCart(productId) {
    const response = await fetch(`${NODE_BASE_URL}/api/cart/remove/${productId}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${getToken()}`
        }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to remove item");
    return data;
}

/* --------------------------------------------------
   ORDERS — PLACE ORDER
-------------------------------------------------- */
async function apiPlaceOrder() {
    const response = await fetch(`${NODE_BASE_URL}/api/order/place`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${getToken()}`
        }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to place order");
    return data;
}

/* --------------------------------------------------
   ORDERS — GET MY ORDERS
-------------------------------------------------- */
async function apiGetOrders() {
    const headers = { "Authorization": `Bearer ${getToken()}` };

    // Support both /api/order and /api/orders backend mounts.
    let response = await fetch(`${NODE_BASE_URL}/api/order/my`, { method: "GET", headers });
    if (response.status === 404) {
        response = await fetch(`${NODE_BASE_URL}/api/orders/my`, { method: "GET", headers });
    }

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to fetch orders");
    return data;   // { orders: [...] }
}
