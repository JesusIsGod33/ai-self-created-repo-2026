const navItems = document.querySelectorAll('.nav-item');
const panels = document.querySelectorAll('.panel');
const pageTitle = document.getElementById('pageTitle');

navItems.forEach((btn) => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    navItems.forEach((b) => b.classList.remove('active'));
    panels.forEach((p) => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${tab}`).classList.add('active');
    pageTitle.textContent = btn.textContent.trim();
  });
});

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  try {
    return { ok: res.ok, status: res.status, data: JSON.parse(text) };
  } catch {
    return { ok: res.ok, status: res.status, data: text };
  }
}

async function refreshHealthAndStatus() {
  const badge = document.getElementById('liveHealthBadge');
  const healthStatus = document.getElementById('healthStatus');
  const healthMeta = document.getElementById('healthMeta');
  const statusJson = document.getElementById('statusJson');

  const health = await fetchJson('/healthz');
  if (health.ok) {
    badge.textContent = 'Live: /healthz 200';
    badge.style.color = '#10b981';
    healthStatus.textContent = 'ONLINE';
    healthMeta.textContent = `HTTP ${health.status} verified`;
  } else {
    badge.textContent = `Health ${health.status}`;
    badge.style.color = '#f59e0b';
    healthStatus.textContent = `HTTP ${health.status}`;
  }

  const status = await fetchJson('/api/status');
  statusJson.textContent = JSON.stringify(status.data, null, 2);
}

document.getElementById('refreshAllBtn').addEventListener('click', refreshHealthAndStatus);

document.getElementById('runJobBtn').addEventListener('click', async () => {
  const role = document.getElementById('jobRoleInput').value;
  const location = document.getElementById('jobLocationInput').value;
  const out = await fetchJson('/api/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role, location }),
  });
  document.getElementById('jobsOutput').textContent = JSON.stringify(out.data, null, 2);
});

document.getElementById('loadTemplatesBtn').addEventListener('click', async () => {
  const out = await fetchJson('/api/templates');
  document.getElementById('templatesOutput').textContent = JSON.stringify(out.data, null, 2);
});

document.getElementById('genCoverBtn').addEventListener('click', async () => {
  const company = document.getElementById('clCompanyInput').value;
  const role = document.getElementById('clRoleInput').value;
  const notes = document.getElementById('clNotesInput').value;
  const out = await fetchJson('/api/cover-letters/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ company, role, notes }),
  });
  document.getElementById('coverLetterOutput').textContent = JSON.stringify(out.data, null, 2);
});

document.getElementById('loadOrderBtn').addEventListener('click', async () => {
  const sku = document.getElementById('orderSkuInput').value;
  const qty = Number(document.getElementById('orderQtyInput').value || 1);
  const out = await fetchJson(`/api/orders/template?sku=${encodeURIComponent(sku)}&qty=${qty}`);
  document.getElementById('orderOutput').textContent = JSON.stringify(out.data, null, 2);
});

document.getElementById('runInvestigateBtn').addEventListener('click', async () => {
  const target = document.getElementById('investigateTargetInput').value;
  const out = await fetchJson('/api/investigate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target }),
  });
  document.getElementById('investigateOutput').textContent = JSON.stringify(out.data, null, 2);
});

document.getElementById('pingMcpBtn').addEventListener('click', async () => {
  const method = document.getElementById('mcpMethodInput').value;
  const out = await fetchJson('/api/mcp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method, id: 1 }),
  });
  document.getElementById('mcpOutput').textContent = JSON.stringify(out.data, null, 2);
});

refreshHealthAndStatus();
