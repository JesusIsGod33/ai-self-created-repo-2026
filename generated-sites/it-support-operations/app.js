const cards = [...document.querySelectorAll(".card[data-section-name]")];
const searchInput = document.getElementById("section-search");
const activeCount = document.getElementById("active-count");
const inspectorTitle = document.getElementById("inspector-title");
const inspectorBody = document.getElementById("inspector-body");
const runStepBtn = document.getElementById("btn-run-step");
const copyLinkBtn = document.getElementById("btn-copy-link");
const activityLog = document.getElementById("activity-log");

let selectedCard = null;

function pushLog(message) {
  if (!activityLog) return;
  const item = document.createElement("li");
  const stamp = new Date().toLocaleTimeString([], { hour12: false });
  item.textContent = `[${stamp}] ${message}`;
  activityLog.prepend(item);
}

function updateVisibleCount() {
  const visible = cards.filter((c) => !c.classList.contains("is-hidden")).length;
  if (activeCount) {
    activeCount.textContent = `${visible} of ${cards.length} Sections Visible`;
  }
}

function selectSection(card) {
  selectedCard = card;
  const name = card.dataset.sectionName || "Section";
  const idx = card.dataset.index || "1";
  cards.forEach((c) => c.classList.add("is-highlighted"));
  if (inspectorTitle) inspectorTitle.textContent = `${name} (Module #${idx})`;
  if (inspectorBody) {
    inspectorBody.textContent = `Section "${name}" is active. Trigger "Run Section Action" to log a workflow run or "Copy Anchor Link" to grab #${card.id}.`;
  }
  if (runStepBtn) runStepBtn.disabled = false;
  if (copyLinkBtn) copyLinkBtn.disabled = false;
  pushLog(`Opened inspector for ${name}`);
}

document.querySelectorAll(".inspect-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const card = btn.closest(".card");
    if (card) selectSection(card);
  });
});

document.querySelectorAll(".pin-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const card = btn.closest(".card");
    if (!card) return;
    const pinned = card.classList.toggle("is-pinned");
    const statusTag = card.querySelector(".status-tag");
    if (statusTag) statusTag.textContent = pinned ? "Pinned" : "Active Module";
    btn.textContent = pinned ? "Unpin" : "Pin Card";
    pushLog(`${pinned ? "Pinned" : "Unpinned"} ${card.dataset.sectionName}`);
  });
});

runStepBtn?.addEventListener("click", () => {
  if (!selectedCard) return;
  const name = selectedCard.dataset.sectionName || "Section";
  selectedCard.classList.add("is-highlighted");
  pushLog(`Executed action on [${name}]`);
});

copyLinkBtn?.addEventListener("click", async () => {
  if (!selectedCard) return;
  const hash = `#${selectedCard.id}`;
  const url = `${window.location.origin}${window.location.pathname}${hash}`;
  window.location.hash = hash;
  try {
    await navigator.clipboard.writeText(url);
    pushLog(`Copied anchor link: ${url}`);
  } catch {
    pushLog(`Set anchor hash: ${hash}`);
  }
});

document.getElementById("btn-highlight-all")?.addEventListener("click", () => {
  cards.forEach((c) => c.classList.add("is-highlighted"));
  pushLog(`Highlighted all ${cards.length} sections`);
});

document.getElementById("btn-clear-all")?.addEventListener("click", () => {
  cards.forEach((c) => {
    c.classList.remove("is-highlighted", "is-pinned");
    const statusTag = c.querySelector(".status-tag");
    const pinBtn = c.querySelector(".pin-btn");
    if (statusTag) statusTag.textContent = "Active Module";
    if (pinBtn) pinBtn.textContent = "Pin Card";
  });
  if (searchInput) searchInput.value = "";
  cards.forEach((c) => c.classList.remove("is-hidden"));
  updateVisibleCount();
  pushLog("Cleared highlights, pins, and search filter");
});

document.getElementById("btn-close-inspector")?.addEventListener("click", () => {
  selectedCard = null;
  if (inspectorTitle) inspectorTitle.textContent = "Select a section to inspect";
  if (inspectorBody) {
    inspectorBody.textContent = 'Click any "Open" button on a card to load interactive controls, run a simulated workflow step, or copy its anchor link.';
  }
  if (runStepBtn) runStepBtn.disabled = true;
  if (copyLinkBtn) copyLinkBtn.disabled = true;
  pushLog("Closed section inspector");
});

document.getElementById("btn-clear-log")?.addEventListener("click", () => {
  if (activityLog) activityLog.innerHTML = "";
});

searchInput?.addEventListener("input", (e) => {
  const query = (e.target.value || "").trim().toLowerCase();
  cards.forEach((c) => {
    const name = (c.dataset.sectionName || "").toLowerCase();
    c.classList.toggle("is-hidden", Boolean(query) && !name.includes(query));
  });
  updateVisibleCount();
});
