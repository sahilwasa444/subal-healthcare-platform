/* ============================================
   SUBAL PHARMA — js/upload.js
   Prescription upload + medicine display
   ============================================ */

let selectedFile = null;

document.addEventListener("DOMContentLoaded", () => {
    initDropZone();
    initHamburger();
    updateCartBadge();
});

/* --------------------------------------------------
   HAMBURGER (mobile nav)
-------------------------------------------------- */
function initHamburger() {
    const hamburger = document.getElementById("hamburger");
    const navLinks  = document.querySelector(".nav-links");
    if (!hamburger) return;
    hamburger.addEventListener("click", () => {
        navLinks.classList.toggle("open");
    });
}

/* --------------------------------------------------
   DROP ZONE
-------------------------------------------------- */
function initDropZone() {
    const dropZone  = document.getElementById("dropZone");
    const fileInput = document.getElementById("prescriptionInput");
    const removeBtn = document.getElementById("removeFile");

    if (!dropZone) return;

    // Drag events
    dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.classList.add("dragover");
    });
    dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragover"));
    dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.classList.remove("dragover");
        if (e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]);
    });

    fileInput.addEventListener("change", () => {
        if (fileInput.files[0]) handleFileSelect(fileInput.files[0]);
    });

    if (removeBtn) removeBtn.addEventListener("click", clearFile);
}

function handleFileSelect(file) {
    const allowed = ["image/jpeg","image/png","image/gif","image/webp","application/pdf"];
    if (!allowed.includes(file.type)) {
        showToast("❌ Only JPG, PNG, or PDF files are allowed.", "error");
        return;
    }
    if (file.size > 10 * 1024 * 1024) {
        showToast("❌ File must be under 10MB.", "error");
        return;
    }
    selectedFile = file;
    document.getElementById("fileName").textContent = file.name;
    document.getElementById("fileSize").textContent = formatSize(file.size);
    document.getElementById("filePreview").style.display = "flex";
}

function clearFile() {
    selectedFile = null;
    document.getElementById("prescriptionInput").value = "";
    document.getElementById("filePreview").style.display = "none";
}

function formatSize(bytes) {
    if (bytes < 1024)        return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

/* --------------------------------------------------
   UPLOAD PRESCRIPTION  ← calls api.js
-------------------------------------------------- */
async function uploadPrescription() {
    if (!selectedFile) {
        showToast("⚠️ Please select a prescription file first.", "error");
        return;
    }

    const btn          = document.getElementById("uploadBtn");
    const progressWrap = document.getElementById("progressWrap");
    const progressBar  = document.getElementById("progressBar");

    // UI: loading state
    btn.disabled   = true;
    btn.textContent = "Uploading…";
    progressWrap.style.display = "block";
    animateProgress(progressBar, 85, 2000);

    try {
        // ← Real API call from api.js
        const data = await apiUploadPrescription(selectedFile);

        progressBar.style.width = "100%";
        setTimeout(() => { progressWrap.style.display = "none"; progressBar.style.width = "0%"; }, 400);

        displayResults(data.matched_drugs);
        showToast("✅ Prescription uploaded successfully!", "success");

    } catch (err) {
        progressWrap.style.display = "none";
        progressBar.style.width    = "0%";
        showToast("❌ " + err.message, "error");
    } finally {
        btn.disabled    = false;
        btn.textContent = "Upload Prescription";
    }
}

/* --------------------------------------------------
   DISPLAY MATCHED MEDICINES
-------------------------------------------------- */
function displayResults(drugs) {
    const resultsDiv   = document.getElementById("results");
    const resultsCount = document.getElementById("resultsCount");

    if (!drugs || drugs.length === 0) {
        resultsDiv.innerHTML = `<div class="empty-state"><span class="empty-icon">💊</span><p>No medicines matched. Try a clearer image.</p></div>`;
        if (resultsCount) resultsCount.textContent = "";
        return;
    }

    if (resultsCount) resultsCount.textContent = `${drugs.length} medicines found`;

    resultsDiv.innerHTML = "";
    const grid = document.createElement("div");
    grid.className = "medicine-grid";

    drugs.forEach((drug, i) => {
        const card = document.createElement("div");
        card.className = "medicine-card";
        card.style.animationDelay = (i * 0.07) + "s";
        card.innerHTML = `
            <div class="med-name">${drug.brand || drug.name}</div>
            <div class="med-dosage">Salt: ${drug.salt || "—"}</div>
            <div class="med-price">₹${drug.price}</div>
            <button class="btn-add" onclick="addToCart('${drug._id}')">+ Add to Cart</button>
        `;
        grid.appendChild(card);
    });

    resultsDiv.appendChild(grid);
    resultsDiv.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/* --------------------------------------------------
   ADD TO CART  ← calls api.js
-------------------------------------------------- */
async function addToCart(productId) {
    if (!isLoggedIn()) {
        showToast("⚠️ Please login to add items to cart.", "error");
        setTimeout(() => window.location.href = "login.html", 1500);
        return;
    }

    try {
        const data = await apiAddToCart(productId, 1);
        showToast("🛒 " + (data.message || "Added to cart!"), "success");
        updateCartBadge();
    } catch (err) {
        showToast("❌ " + err.message, "error");
    }
}

/* --------------------------------------------------
   CART BADGE
-------------------------------------------------- */
async function updateCartBadge() {
    const badge = document.getElementById("cartBadge");
    if (!badge || !isLoggedIn()) return;
    try {
        const data = await apiGetCart();
        const count = data.items ? data.items.length : 0;
        badge.textContent = count;
    } catch (_) {
        badge.textContent = "0";
    }
}

/* --------------------------------------------------
   PROGRESS BAR ANIMATION
-------------------------------------------------- */
function animateProgress(bar, target, duration) {
    let start = null;
    function step(ts) {
        if (!start) start = ts;
        const p = Math.min(((ts - start) / duration) * target, target);
        bar.style.width = p + "%";
        if (p < target) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

/* --------------------------------------------------
   TOAST
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
