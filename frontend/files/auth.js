/* ============================================
   SUBAL PHARMA — js/auth.js
   Login + Register page logic
   ============================================ */

document.addEventListener("DOMContentLoaded", () => {
    // If already logged in, redirect to index
    if (isLoggedIn() && (window.location.pathname.includes("login") || window.location.pathname.includes("register"))) {
        window.location.href = "index.html";
    }

    const loginForm    = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");

    if (loginForm)    loginForm.addEventListener("submit", handleLogin);
    if (registerForm) registerForm.addEventListener("submit", handleRegister);
});

/* --------------------------------------------------
   LOGIN
-------------------------------------------------- */
async function handleLogin(e) {
    e.preventDefault();
    const email    = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const btn      = document.getElementById("authBtn");
    const errorDiv = document.getElementById("authError");

    if (!email || !password) {
        showAuthError("Please fill in all fields.");
        return;
    }

    btn.disabled    = true;
    btn.textContent = "Logging in…";
    clearAuthError();

    try {
        const data = await apiLogin(email, password);
        setToken(data.token);
        showToastInline("✅ Login successful! Redirecting…", "success");
        setTimeout(() => window.location.href = "index.html", 1200);
    } catch (err) {
        showAuthError(err.message);
    } finally {
        btn.disabled    = false;
        btn.textContent = "Login";
    }
}

/* --------------------------------------------------
   REGISTER
-------------------------------------------------- */
async function handleRegister(e) {
    e.preventDefault();
    const name     = document.getElementById("name").value.trim();
    const email    = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirm  = document.getElementById("confirmPassword").value;
    const btn      = document.getElementById("authBtn");

    if (!name || !email || !password) {
        showAuthError("Please fill in all fields.");
        return;
    }
    if (password !== confirm) {
        showAuthError("Passwords do not match.");
        return;
    }
    if (password.length < 6) {
        showAuthError("Password must be at least 6 characters.");
        return;
    }

    btn.disabled    = true;
    btn.textContent = "Registering…";
    clearAuthError();

    try {
        await apiRegister(name, email, password);
        showToastInline("✅ Registered! Please login.", "success");
        setTimeout(() => window.location.href = "login.html", 1400);
    } catch (err) {
        showAuthError(err.message);
    } finally {
        btn.disabled    = false;
        btn.textContent = "Register";
    }
}

/* --------------------------------------------------
   LOGOUT
-------------------------------------------------- */
function logout() {
    removeToken();
    window.location.href = "login.html";
}

/* --------------------------------------------------
   HELPERS
-------------------------------------------------- */
function showAuthError(msg) {
    const el = document.getElementById("authError");
    if (el) { el.textContent = msg; el.style.display = "block"; }
}

function clearAuthError() {
    const el = document.getElementById("authError");
    if (el) { el.textContent = ""; el.style.display = "none"; }
}

function showToastInline(message, type) {
    const el = document.getElementById("authSuccess");
    if (!el) return;
    el.textContent = message;
    el.style.display = "block";
    el.style.color = type === "success" ? "#0a4f3c" : "#c0392b";
}
