const profileContent = document.getElementById('profile-content');
const jobDescriptionInput = document.getElementById('job-description');
const analyzeBtn = document.getElementById('analyze-btn');
const tailorBtn = document.getElementById('tailor-btn');
const exportBtn = document.getElementById('export-btn');
const alignmentOutput = document.getElementById('alignment-output');
const draftOutput = document.getElementById('draft-output');
const atsOutput = document.getElementById('ats-output');

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'content-type': 'application/json' },
    ...options
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || 'Request failed.');
  }
  return payload;
}

function renderProfile(profile) {
  profileContent.innerHTML = '';

  const headerCard = document.createElement('div');
  headerCard.className = 'card';
  headerCard.innerHTML = `
    <strong>${profile.name || 'Unnamed Profile'}</strong>
    <div class="meta">${[profile.contact?.email, profile.contact?.location].filter(Boolean).join(' • ')}</div>
    <p>${profile.summary || ''}</p>
  `;
  profileContent.appendChild(headerCard);

  for (const role of profile.roles || []) {
    const roleCard = document.createElement('div');
    roleCard.className = 'card';
    const bullets = (role.accomplishments || [])
      .map(
        (item) =>
          `<li>${item.text} <span class="meta">[${item.verificationStatus} — ${item.source}]</span></li>`
      )
      .join('');
    roleCard.innerHTML = `
      <strong>${role.title} — ${role.company}</strong>
      <div class="meta">${role.startDate}–${role.endDate}</div>
      <ul>${bullets}</ul>
    `;
    profileContent.appendChild(roleCard);
  }
}

function renderAlignment(data) {
  alignmentOutput.innerHTML = '';
  const items = data.mapping || data;
  for (const item of items) {
    const card = document.createElement('div');
    card.className = 'card';
    const statusClass = `badge-${item.status}`;
    const evidenceText = (item.evidence || [])
      .map((ev) => `${ev.text} (${ev.source})`)
      .join(' | ');
    card.innerHTML = `
      <div><span class="${statusClass}">${String(item.status || '').toUpperCase()}</span> — <strong>${item.requirement}</strong></div>
      <div class="meta">${evidenceText || 'No matching verified evidence'}</div>
    `;
    alignmentOutput.appendChild(card);
  }
}

function renderDraft(draft) {
  draftOutput.innerHTML = '';
  const card = document.createElement('div');
  card.className = 'card';
  const roleBlocks = (draft.roles || [])
    .map(
      (role) => `
        <div>
          <strong>${role.title} — ${role.company}</strong>
          <ul>${(role.accomplishments || []).map((a) => `<li>${a.text}</li>`).join('')}</ul>
        </div>
      `
    )
    .join('');
  card.innerHTML = `
    <strong>${draft.title || 'Resume draft'}</strong>
    <p>${draft.summary || ''}</p>
    ${roleBlocks}
    <div class="meta">${draft.disclaimer || ''}</div>
  `;
  draftOutput.appendChild(card);
}

function renderExport(exported) {
  atsOutput.innerHTML = '';
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <strong>${exported.filename || 'grounded-resume.txt'}</strong>
    <pre class="plain-export">${exported.content || ''}</pre>
  `;
  atsOutput.appendChild(card);
}

async function init() {
  try {
    const profile = await requestJson('/api/profile');
    renderProfile(profile);
  } catch (error) {
    profileContent.innerHTML = `<div class="card badge-gap">${error.message}</div>`;
  }
}

analyzeBtn.addEventListener('click', async () => {
  try {
    const result = await requestJson('/api/analyze', {
      method: 'POST',
      body: JSON.stringify({ jobDescription: jobDescriptionInput.value })
    });
    renderAlignment(result);
  } catch (error) {
    alignmentOutput.innerHTML = `<div class="card badge-gap">${error.message}</div>`;
  }
});

tailorBtn.addEventListener('click', async () => {
  try {
    const draft = await requestJson('/api/tailor', {
      method: 'POST',
      body: JSON.stringify({ jobDescription: jobDescriptionInput.value })
    });
    renderDraft(draft);
  } catch (error) {
    draftOutput.innerHTML = `<div class="card badge-gap">${error.message}</div>`;
  }
});

exportBtn.addEventListener('click', async () => {
  try {
    const exported = await requestJson('/api/export', {
      method: 'POST',
      body: JSON.stringify({ jobDescription: jobDescriptionInput.value, format: 'text' })
    });
    renderExport(exported);
  } catch (error) {
    atsOutput.innerHTML = `<div class="card badge-gap">${error.message}</div>`;
  }
});

init();
