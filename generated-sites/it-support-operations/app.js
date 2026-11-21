const out = document.getElementById("site-output");
const panels = [...document.querySelectorAll(".panel[id]")].filter((el) => el.id !== "output-console");

document.getElementById("btn-expand-all")?.addEventListener("click", () => {
  panels.forEach((p) => p.classList.add("is-highlighted"));
  out.textContent = `Highlighted ${panels.length} full-page sections at ${new Date().toISOString()}`;
});

document.getElementById("btn-reset-all")?.addEventListener("click", () => {
  panels.forEach((p) => p.classList.remove("is-highlighted"));
  out.textContent = `Reset highlights across ${panels.length} sections at ${new Date().toISOString()}`;
});

document.querySelectorAll(".action-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const sec = btn.dataset.section || "Section";
    out.textContent = `Executed full-page action for [${sec}] at ${new Date().toISOString()}`;
  });
});
