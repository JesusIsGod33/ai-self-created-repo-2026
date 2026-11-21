const RESUME_DATA = {
  summary:
    "Remote IT and digital support specialist experienced in Windows troubleshooting, Active Directory, Microsoft 365, Entra ID, Okta, patch management, and ServiceNow/Salesforce/Zendesk ticketing, paired with hands-on care coordination, logistics, and bilingual English/Spanish communication.",
  certs: [
    "CompTIA A+",
    "CompTIA Security+",
    "ITIL Foundation",
    "Cisco Certified Support Technician (CCST)",
    "CNA Training, CPR & Caregiver Credentials"
  ],
  skills: [
    { label: "Windows & Endpoint Support", group: "IT" },
    { label: "Active Directory & Group Policy", group: "IT" },
    { label: "Microsoft 365, Entra ID & Okta", group: "IT" },
    { label: "OS Updates & Vulnerability Patches", group: "IT" },
    { label: "ServiceNow, Salesforce & Zendesk", group: "IT" },
    { label: "Python, Bash, PowerShell & SQLite", group: "IT" },
    { label: "Care Plans & Vital Tracking", group: "OPS" },
    { label: "Warehouse & Inventory Operations", group: "OPS" },
    { label: "Merchandise & Seasonal Staging", group: "OPS" },
    { label: "Bilingual English & Spanish", group: "OPS" }
  ],
  education:
    "<p><strong>High School Diploma</strong> — Oasis High School (June 2023)</p><p><strong>Languages:</strong> English (Fluent), Spanish (Fluent)</p>",
  experience: [
    {
      role: "Desktop & Digital Support Analyst (Remote)",
      org: "DXC Technology",
      period: "2023 – 2026",
      bullets: [
        "Resolved Windows hardware and software incidents and administered Active Directory, Microsoft 365, Entra ID, Okta, and Group Policies.",
        "Managed OS updates and vulnerability patching while documenting ticket lifecycles in ServiceNow, Salesforce, and Zendesk and authoring Tier 1 knowledge base guides."
      ]
    },
    {
      role: "IT Support Technician (Remote)",
      org: "CloudWise Support",
      period: "2023",
      bullets: [
        "Delivered inbound chat and email support for web-based platforms and resolved account access and browser connectivity issues."
      ]
    },
    {
      role: "Help Desk Technician (Remote)",
      org: "ShieldNet Solutions",
      period: "2022 – 2023",
      bullets: [
        "Handled digital inquiries, resolved hardware and software conflicts, and escalated network incidents."
      ]
    },
    {
      role: "Lead Home Health Aide",
      org: "Amistad Support",
      period: "2021 – 2024",
      bullets: [
        "Oversaw individualized care plans, activities of daily living, vital tracking, and health documentation."
      ]
    },
    {
      role: "Warehouse & Retail Operations Associate",
      org: "Warehouse & Retail Operations",
      period: "2019 – 2026",
      bullets: [
        "Executed high-volume fulfillment, inventory staging, cold-protection plant prep, and weekly promotional displays."
      ]
    }
  ]
};

let activeSkillGroup = "ALL";

function renderCerts() {
  const ul = document.getElementById("cert-list");
  ul.innerHTML = RESUME_DATA.certs.map((c) => `<li>${c}</li>`).join("");
}

function renderSkills() {
  const ul = document.getElementById("skill-list");
  const filtered =
    activeSkillGroup === "ALL"
      ? RESUME_DATA.skills
      : RESUME_DATA.skills.filter((s) => s.group === activeSkillGroup);
  ul.innerHTML = filtered.map((s) => `<li class="pill-item">${s.label}</li>`).join("");
}

function renderExperience() {
  document.getElementById("summary-copy").textContent = RESUME_DATA.summary;
  document.getElementById("edu-block").innerHTML = RESUME_DATA.education;
  document.getElementById("exp-count").textContent = `${RESUME_DATA.experience.length} roles`;

  const container = document.getElementById("experience-list");
  container.innerHTML = RESUME_DATA.experience
    .map(
      (item) => `
      <article class="exp-item">
        <div class="exp-top">
          <h3 class="exp-title">${item.role} — ${item.org}</h3>
          <span class="exp-meta">${item.period}</span>
        </div>
        <ul class="exp-bullets">
          ${item.bullets.map((b) => `<li>${b}</li>`).join("")}
        </ul>
      </article>
    `
    )
    .join("");
}

document.querySelectorAll(".chip").forEach((btn) => {
  btn.addEventListener("click", () => {
    activeSkillGroup = btn.dataset.filter || "ALL";
    document.querySelectorAll(".chip").forEach((c) => c.classList.toggle("is-active", c === btn));
    renderSkills();
  });
});

document.getElementById("btn-toggle-compact").addEventListener("click", () => {
  document.body.classList.toggle("compact");
});

document.getElementById("btn-print-resume").addEventListener("click", () => {
  window.print();
});

renderCerts();
renderSkills();
renderExperience();
