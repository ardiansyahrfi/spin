// ---------- KONSTANTA ----------
const STORAGE_ENTRIES_KEY = "spinwheel_entries_v5";
const STORAGE_SPINS_KEY = "spinwheel_total_spins_v5";
const STORAGE_RESULTS_KEY = "spinwheel_results_v5";
const STORAGE_TITLE_KEY = "spinwheel_title_v1";
const STORAGE_DESC_KEY = "spinwheel_desc_v1";
const STORAGE_SHOW_WINNER_KEY = "spinwheel_show_winner_popup_v1";

const wheel = document.getElementById("wheel");
const ctx = wheel.getContext("2d");

const centerImageEl = document.getElementById("centerImage");

const entriesInput = document.getElementById("entriesInput");
const updateEntriesBtn = document.getElementById("updateEntriesBtn");
const clearEntriesBtn = document.getElementById("clearEntriesBtn");
const spinBtn = document.getElementById("spinBtn");
const resultEl = document.getElementById("result");
const statsEl = document.getElementById("stats");

// title elements
const wheelTitleEl = document.getElementById("wheelTitle");
const wheelDescriptionEl = document.getElementById("wheelDescription");
const editTitleBtn = document.getElementById("editTitleBtn");
const titleModal = document.getElementById("titleModal");
const titleInput = document.getElementById("titleInput");
const descriptionInput = document.getElementById("descriptionInput");
const titleCancelBtn = document.getElementById("titleCancelBtn");
const titleOkBtn = document.getElementById("titleOkBtn");

// side panel elements
const sidePanel = document.querySelector(".side-panel");
const tabButtons = document.querySelectorAll(".tab");
const entriesView = document.getElementById("entriesView");
const resultsView = document.getElementById("resultsView");
const entriesCountEl = document.getElementById("entriesCount");
const resultsCountEl = document.getElementById("resultsCount");
const hidePanelToggle = document.getElementById("hidePanelToggle");

// toolbar buttons
const shuffleBtn = document.getElementById("shuffleBtn");
const sortEntriesBtn = document.getElementById("sortEntriesBtn");
const sortResultsBtn = document.getElementById("sortResultsBtn");
const clearResultsBtn = document.getElementById("clearResultsBtn");

// dropdown add image
const addImageBtn = document.getElementById("addImageBtn");
const addImageMenu = document.getElementById("addImageMenu");
const imageFileInput = document.getElementById("imageFileInput");
let pendingImageMode = null;

// results list
const resultsListEl = document.getElementById("resultsList");

// Winner modal
const winnerModal = document.getElementById("winnerModal");
const winnerNameText = document.getElementById("winnerNameText");
const winnerCloseBtn = document.getElementById("winnerCloseBtn");
const winnerRemoveBtn = document.getElementById("winnerRemoveBtn");
const closeWinnerModalBtn = document.getElementById("closeWinnerModalBtn");

// toggle show/hide popup pemenang
const showWinnerToggle = document.getElementById("showWinnerToggle");

// Confetti canvas
const confettiCanvas = document.getElementById("confettiCanvas");
const confettiCtx = confettiCanvas.getContext("2d");

// TOPBAR drawer (mobile)
const topbarMenuToggle = document.getElementById("topbarMenuToggle");
const topbarDrawer = document.getElementById("topbarDrawer");
const topbarDrawerBackdrop = document.getElementById("topbarDrawerBackdrop");
const topbarDrawerClose = document.getElementById("topbarDrawerClose");

// ---------- AUDIO ----------
const bgAudio = new Audio(
  "https://cdn.pixabay.com/download/audio/2022/03/15/audio_7f541f627a.mp3?filename=game-music-loop-113128.mp3"
);
bgAudio.loop = true;

const winAudio = new Audio(
  "https://cdn.pixabay.com/download/audio/2021/08/04/audio_9b853de48f.mp3?filename=game-win-111168.mp3"
);

function playBgAudio() {
  try {
    bgAudio.currentTime = 0;
    bgAudio.play();
  } catch (e) {
    console.warn("Tidak bisa memutar bgAudio", e);
  }
}

function stopBgAudio() {
  try {
    bgAudio.pause();
    bgAudio.currentTime = 0;
  } catch (e) {}
}

function playWinAudio() {
  try {
    winAudio.currentTime = 0;
    winAudio.play();
  } catch (e) {
    console.warn("Tidak bisa memutar winAudio", e);
  }
}

function stopWinAudio() {
  try {
    winAudio.pause();
    winAudio.currentTime = 0;
  } catch (e) {}
}

// warna sektor
const colors = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6"
];

// ---------- STATE ----------
let entries = [];
let currentRotation = 0;
let isSpinning = false;
let totalSpins = 0;
let lastWinnerIndex = null;
let results = [];
let wheelTitle = "Wheel tanpa judul";
let wheelDescription = "";
let showWinnerPopup = true;

let confettiParticles = [];
let confettiAnimationId = null;

// ---------- STORAGE ----------
function normalizeEntries(raw) {
  if (!Array.isArray(raw)) return [];
  if (raw.length === 0) return [];
  if (typeof raw[0] === "string") {
    return raw.map((label) => ({ label }));
  }
  return raw.map((e) => ({
    label: e.label || "",
    imageDataUrl: e.imageDataUrl || null
  }));
}

function saveToStorage() {
  localStorage.setItem(STORAGE_ENTRIES_KEY, JSON.stringify(entries));
  localStorage.setItem(STORAGE_SPINS_KEY, String(totalSpins));
  localStorage.setItem(STORAGE_RESULTS_KEY, JSON.stringify(results));
  localStorage.setItem(STORAGE_TITLE_KEY, wheelTitle || "");
  localStorage.setItem(STORAGE_DESC_KEY, wheelDescription || "");
  localStorage.setItem(
    STORAGE_SHOW_WINNER_KEY,
    showWinnerPopup ? "1" : "0"
  );
}

function loadFromStorage() {
  const storedEntries = localStorage.getItem(STORAGE_ENTRIES_KEY);
  const storedSpins = localStorage.getItem(STORAGE_SPINS_KEY);
  const storedResults = localStorage.getItem(STORAGE_RESULTS_KEY);
  const storedTitle = localStorage.getItem(STORAGE_TITLE_KEY);
  const storedDesc = localStorage.getItem(STORAGE_DESC_KEY);
  const storedShowWinner = localStorage.getItem(STORAGE_SHOW_WINNER_KEY);

  if (storedEntries) {
    try {
      entries = normalizeEntries(JSON.parse(storedEntries));
    } catch (e) {
      console.warn("Gagal parse entries", e);
    }
  }

  if (storedSpins) {
    const n = parseInt(storedSpins, 10);
    if (!isNaN(n)) totalSpins = n;
  }

  if (storedResults) {
    try {
      const parsedR = JSON.parse(storedResults);
      if (Array.isArray(parsedR)) results = parsedR;
    } catch (e) {
      console.warn("Gagal parse results", e);
    }
  }

  if (storedTitle) wheelTitle = storedTitle;
  if (storedDesc) wheelDescription = storedDesc;

  if (storedShowWinner === "0") {
    showWinnerPopup = false;
    if (showWinnerToggle) showWinnerToggle.checked = false;
  } else if (storedShowWinner === "1") {
    showWinnerPopup = true;
    if (showWinnerToggle) showWinnerToggle.checked = true;
  }

  entries.forEach((entry) => {
    if (entry.imageDataUrl) {
      const img = new Image();
      img.src = entry.imageDataUrl;
      img.onload = () => drawWheel();
      entry.image = img;
    }
  });
}

// ---------- UI HELPERS ----------
function updateStats() {
  statsEl.textContent = `Total spin: ${totalSpins}`;
}

function updateEntriesCount() {
  entriesCountEl.textContent = `(${entries.length})`;
}

function updateResultsCount() {
  resultsCountEl.textContent = `(${results.length})`;
}

function updateTextareaFromEntries() {
  entriesInput.value = entries.map((e) => e.label).join("\n");
}

function showMessage(msg) {
  resultEl.textContent = msg;
}

function renderTitle() {
  wheelTitleEl.textContent = wheelTitle || "Wheel tanpa judul";
  wheelDescriptionEl.textContent = wheelDescription;
  wheelDescriptionEl.style.display = wheelDescription ? "block" : "none";
}

// ---------- CONFETTI ----------
function resizeConfettiCanvas() {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeConfettiCanvas);

function createConfettiParticles() {
  const c = ["#facc15", "#22c55e", "#3b82f6", "#ec4899", "#f97316"];
  const count = 180;

  confettiParticles = [];
  for (let i = 0; i < count; i++) {
    confettiParticles.push({
      x: Math.random() * confettiCanvas.width,
      y: Math.random() * -confettiCanvas.height,
      size: 5 + Math.random() * 6,
      color: c[Math.floor(Math.random() * c.length)],
      vy: 2 + Math.random() * 4,
      vx: -1 + Math.random() * 2,
      rotation: Math.random() * Math.PI * 2,
      vr: -0.1 + Math.random() * 0.2
    });
  }
}

function drawConfetti() {
  confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

  confettiParticles.forEach((p) => {
    p.x += p.vx;
    p.y += p.vy;
    p.rotation += p.vr;

    if (p.y > confettiCanvas.height + 20) {
      p.y = -20;
    }

    confettiCtx.save();
    confettiCtx.translate(p.x, p.y);
    confettiCtx.rotate(p.rotation);
    confettiCtx.fillStyle = p.color;
    confettiCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.4);
    confettiCtx.restore();
  });

  confettiAnimationId = requestAnimationFrame(drawConfetti);
}

function startConfetti(durationMs = 3000) {
  resizeConfettiCanvas();
  createConfettiParticles();
  if (confettiAnimationId) cancelAnimationFrame(confettiAnimationId);
  drawConfetti();

  setTimeout(() => {
    stopConfetti();
  }, durationMs);
}

function stopConfetti() {
  if (confettiAnimationId) {
    cancelAnimationFrame(confettiAnimationId);
    confettiAnimationId = null;
  }
  confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
}

// ---------- DRAW WHEEL ----------
function drawWheel() {
  const size = wheel.width;
  const radius = size / 2;
  ctx.clearRect(0, 0, size, size);

  if (entries.length === 0) {
    ctx.save();
    ctx.translate(radius, radius);
    ctx.fillStyle = "#e5e7eb";
    ctx.beginPath();
    ctx.arc(0, 0, radius - 5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = "#4b5563";
    ctx.font = "bold 18px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Tambahkan nama", 0, -8);
    ctx.fillText("di panel Entries →", 0, 16);
    ctx.restore();
    return;
  }

  const sliceAngle = (2 * Math.PI) / entries.length;

  entries.forEach((entry, i) => {
    const startAngle = i * sliceAngle;
    const endAngle = startAngle + sliceAngle;

    ctx.beginPath();
    ctx.moveTo(radius, radius);
    ctx.arc(radius, radius, radius - 5, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();

    if (entry.image && entry.image.complete) {
      ctx.save();
      ctx.translate(radius, radius);
      ctx.rotate(startAngle + sliceAngle / 2);

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius - 5, -sliceAngle / 2, sliceAngle / 2);
      ctx.closePath();
      ctx.clip();

      const imgRadius = radius;
      ctx.drawImage(
        entry.image,
        -imgRadius,
        -imgRadius,
        imgRadius * 2,
        imgRadius * 2
      );

      ctx.restore();
      return;
    }

    ctx.save();
    ctx.translate(radius, radius);
    const textAngle = startAngle + sliceAngle / 2;
    ctx.rotate(textAngle);

    const label = entry.label || "";
    const parts = label.split("–");
    let line1 = parts[0] ? parts[0].trim() : label.trim();
    let line2 = parts[1] ? parts[1].trim() : "";

    if (line1.length > 18) line1 = line1.slice(0, 18) + "…";
    if (line2.length > 20) line2 = line2.slice(0, 20) + "…";

    const textRadius = radius * 0.6;

    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(15, 23, 42, 0.9)";
    ctx.shadowBlur = 4;

    ctx.font = "600 15px system-ui, sans-serif";
    ctx.fillText(line1, textRadius, -3);

    if (line2) {
      ctx.font = "500 13px system-ui, sans-serif";
      ctx.fillText(line2, textRadius, 14);
    }

    ctx.restore();
  });
}

function getWinner(angleDeg) {
  if (entries.length === 0) return null;

  const sliceDeg = 360 / entries.length;
  const normalized = (360 - (angleDeg % 360)) % 360;
  const index = Math.floor(normalized / sliceDeg);
  return { index, entry: entries[index] };
}

// ---------- RESULTS RENDER ----------
function renderResultsList() {
  resultsListEl.innerHTML = "";
  results.forEach((item, idx) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div>${idx + 1}. ${item.name}</div>
      <span class="time">${item.time}</span>
    `;
    resultsListEl.appendChild(li);
  });
  updateResultsCount();
}

// ---------- MODAL WINNER ----------
function openWinnerModal(name, index) {
  winnerNameText.textContent = name;
  lastWinnerIndex = index;
  winnerModal.classList.add("show");
}

function closeWinnerModal() {
  winnerModal.classList.remove("show");
  stopBgAudio();
  stopWinAudio();
}

// ---------- MODAL TITLE ----------
function openTitleModal() {
  titleInput.value = wheelTitle;
  descriptionInput.value = wheelDescription;
  titleModal.classList.add("show");
  titleInput.focus();
}

function closeTitleModal() {
  titleModal.classList.remove("show");
  stopBgAudio();
  stopWinAudio();
}

// ---------- SIDE PANEL: TABS & HIDE ----------
tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    tabButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const tab = btn.dataset.tab;
    if (tab === "entries") {
      entriesView.classList.remove("hidden");
      resultsView.classList.add("hidden");
    } else {
      entriesView.classList.add("hidden");
      resultsView.classList.remove("hidden");
    }
  });
});

hidePanelToggle.addEventListener("change", () => {
  if (hidePanelToggle.checked) {
    sidePanel.classList.add("collapsed");
  } else {
    sidePanel.classList.remove("collapsed");
  }
});

// toggle show/hide popup pemenang
if (showWinnerToggle) {
  showWinnerToggle.addEventListener("change", () => {
    showWinnerPopup = showWinnerToggle.checked;
    localStorage.setItem(
      STORAGE_SHOW_WINNER_KEY,
      showWinnerPopup ? "1" : "0"
    );
  });
}

// ---------- ENTRIES PANEL ----------
updateEntriesBtn.addEventListener("click", () => {
  const lines = entriesInput.value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    entries = [];
    drawWheel();
    showMessage("Wheel kosong. Tambahkan nama dulu ya 🙂");
    updateEntriesCount();
    saveToStorage();
    return;
  }

  if (lines.length < 2) {
    alert("Minimal 2 nama supaya spin terasa seru 🙂");
  }

  entries = lines.map((label) => ({ label }));
  currentRotation = 0;
  wheel.style.transform = "rotate(0deg)";
  drawWheel();
  showMessage("Wheel sudah diupdate.");
  updateEntriesCount();
  saveToStorage();
});

clearEntriesBtn.addEventListener("click", () => {
  if (!confirm("Hapus semua nama dari wheel?")) return;

  entries = [];
  entriesInput.value = "";
  currentRotation = 0;
  wheel.style.transform = "rotate(0deg)";
  drawWheel();
  showMessage("Semua nama sudah dihapus.");
  updateEntriesCount();
  saveToStorage();
});

// Shuffle
shuffleBtn.addEventListener("click", () => {
  if (entries.length <= 1) return;
  for (let i = entries.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [entries[i], entries[j]] = [entries[j], entries[i]];
  }
  updateTextareaFromEntries();
  drawWheel();
  saveToStorage();
});

// Sort entries
sortEntriesBtn.addEventListener("click", () => {
  entries.sort((a, b) => a.label.localeCompare(b.label));
  updateTextareaFromEntries();
  drawWheel();
  saveToStorage();
});

// ---------- RESULTS PANEL ----------
sortResultsBtn.addEventListener("click", () => {
  results.sort((a, b) => a.name.localeCompare(b.name));
  renderResultsList();
  saveToStorage();
});

clearResultsBtn.addEventListener("click", () => {
  if (!confirm("Clear semua results?")) return;
  results = [];
  renderResultsList();
  saveToStorage();
});

// ---------- DROPDOWN ADD IMAGE ----------
addImageBtn.addEventListener("click", () => {
  addImageMenu.classList.toggle("show");
});

document.addEventListener("click", (e) => {
  if (!addImageBtn.contains(e.target) && !addImageMenu.contains(e.target)) {
    addImageMenu.classList.remove("show");
  }
});

addImageMenu.addEventListener("click", (e) => {
  const mode = e.target.dataset.mode;
  if (!mode) return;
  pendingImageMode = mode;
  addImageMenu.classList.remove("show");
  imageFileInput.value = "";
  imageFileInput.click();
});

imageFileInput.addEventListener("change", () => {
  const file = imageFileInput.files[0];
  if (!file || !pendingImageMode) return;

  const reader = new FileReader();
  reader.onload = (ev) => {
    const dataUrl = ev.target.result;

    if (pendingImageMode === "bg") {
      document.body.style.backgroundImage = `url(${dataUrl})`;
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundPosition = "center";
    } else if (pendingImageMode === "center") {
      centerImageEl.src = dataUrl;
      centerImageEl.style.display = "block";
    } else if (pendingImageMode === "entry") {
      const label =
        prompt("Nama untuk entry ini:", "Image entry") || "Image entry";

      const img = new Image();
      img.src = dataUrl;
      const entry = { label, imageDataUrl: dataUrl, image: img };
      img.onload = () => drawWheel();

      entries.push(entry);
      updateTextareaFromEntries();
      drawWheel();
      updateEntriesCount();
      saveToStorage();
    }

    pendingImageMode = null;
  };
  reader.readAsDataURL(file);
});

// ---------- SPIN ----------
spinBtn.addEventListener("click", () => {
  if (isSpinning) return;

  if (entries.length === 0) {
    alert("Belum ada nama di wheel. Tambahkan dulu ya.");
    return;
  }

  isSpinning = true;
  spinBtn.disabled = true;
  showMessage("Memutar...");

  stopWinAudio();
  playBgAudio();

  const randomExtra = Math.random() * 360;
  const spins = 5 * 360;
  const targetRotation = currentRotation + spins + randomExtra;

  wheel.style.transition =
    "transform 4s cubic-bezier(0.25, 0.1, 0.1, 1)";
  wheel.style.transform = `rotate(${targetRotation}deg)`;

  const onTransitionEnd = () => {
    wheel.removeEventListener("transitionend", onTransitionEnd);
    currentRotation = targetRotation;

    stopBgAudio();

    const winnerData = getWinner(currentRotation);
    if (!winnerData) {
      showMessage("Tidak ada nama di wheel.");
      isSpinning = false;
      spinBtn.disabled = false;
      return;
    }

    const { index, entry } = winnerData;
    const name = entry.label;

    totalSpins += 1;
    updateStats();

    const now = new Date();
    const timeStr = now.toLocaleTimeString();
    results.push({ name, time: timeStr });
    renderResultsList();

    saveToStorage();

    showMessage(`🎉 Pemenang: ${name}`);

    playWinAudio();
    startConfetti(3500);

    if (showWinnerPopup) {
      openWinnerModal(name, index);
    }

    isSpinning = false;
    spinBtn.disabled = false;
  };

  wheel.addEventListener("transitionend", onTransitionEnd);
});

// ---------- TITLE MODAL EVENTS ----------
editTitleBtn.addEventListener("click", () => {
  openTitleModal();
});

titleCancelBtn.addEventListener("click", () => {
  closeTitleModal();
});

titleOkBtn.addEventListener("click", () => {
  wheelTitle = titleInput.value.trim() || "Wheel tanpa judul";
  wheelDescription = descriptionInput.value.trim();
  renderTitle();
  saveToStorage();
  closeTitleModal();
});

titleModal.addEventListener("click", (e) => {
  if (e.target === titleModal) {
    closeTitleModal();
  }
});

// ---------- WINNER MODAL EVENTS ----------
winnerCloseBtn.addEventListener("click", () => {
  closeWinnerModal();
});

closeWinnerModalBtn.addEventListener("click", () => {
  closeWinnerModal();
});

winnerModal.addEventListener("click", (e) => {
  if (e.target === winnerModal) {
    closeWinnerModal();
  }
});

// Remove winner dari entries
winnerRemoveBtn.addEventListener("click", () => {
  if (lastWinnerIndex == null || entries.length === 0) {
    closeWinnerModal();
    return;
  }

  const removedName = entries[lastWinnerIndex].label;
  entries.splice(lastWinnerIndex, 1);
  updateTextareaFromEntries();
  drawWheel();
  updateEntriesCount();
  saveToStorage();

  showMessage(
    `🎉 Pemenang: ${removedName} (sudah dihapus dari wheel)`
  );
  closeWinnerModal();
});

// ---------- TOPBAR DRAWER EVENTS (MOBILE) ----------
function openTopbarDrawer() {
  if (!topbarDrawer || !topbarDrawerBackdrop) return;
  topbarDrawer.classList.add("open");
  topbarDrawerBackdrop.classList.add("show");
}

function closeTopbarDrawer() {
  if (!topbarDrawer || !topbarDrawerBackdrop) return;
  topbarDrawer.classList.remove("open");
  topbarDrawerBackdrop.classList.remove("show");
}

if (topbarMenuToggle) {
  topbarMenuToggle.addEventListener("click", () => {
    openTopbarDrawer();
  });
}

if (topbarDrawerClose) {
  topbarDrawerClose.addEventListener("click", closeTopbarDrawer);
}

if (topbarDrawerBackdrop) {
  topbarDrawerBackdrop.addEventListener("click", closeTopbarDrawer);
}

document.querySelectorAll(".drawer-menu .drawer-item").forEach((btn) => {
  btn.addEventListener("click", () => {
    closeTopbarDrawer();
  });
});

// ---------- INIT ----------
(function init() {
  loadFromStorage();
  updateTextareaFromEntries();
  drawWheel();
  renderResultsList();
  updateStats();
  resizeConfettiCanvas();
  updateEntriesCount();
  renderTitle();
  showMessage("Silakan edit daftar nama, lalu klik SPIN.");
})();
