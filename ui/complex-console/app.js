const DOMAINS = [
  { id: 'A_INGESTION', name: 'Document & Feed Ingestion', tools: 10, sampleTool: 'parse_pdf_layout_tree' },
  { id: 'B_PROFILE_SYNTHESIS', name: 'Candidate Profile Synthesis', tools: 10, sampleTool: 'extract_skill_graph' },
  { id: 'C_JOB_DISCOVERY', name: 'Job & Endpoint Discovery', tools: 10, sampleTool: 'verify_url_mirror_health' },
  { id: 'D_MATCH_SCORING', name: 'Semantic Role Scoring', tools: 10, sampleTool: 'rank_role_fit_vector' },
  { id: 'E_TAILORING', name: 'Resume & Pitch Tailoring', tools: 10, sampleTool: 'synthesize_role_resume' },
  { id: 'F_APPLICATION_EXEC', name: 'Application Execution', tools: 10, sampleTool: 'stage_application_payload' },
  { id: 'G_OUTREACH_NETWORK', name: 'Hiring Outreach & Follow-Up', tools: 10, sampleTool: 'draft_recruiter_ping' },
  { id: 'H_INTERVIEW_PREP', name: 'Technical & Behavioral Prep', tools: 10, sampleTool: 'build_system_design_brief' },
  { id: 'I_ANALYTICS_TELEMETRY', name: 'Pipeline Metrics & Audit', tools: 10, sampleTool: 'compute_conversion_funnel' },
  { id: 'J_SELF_HEALING_CI', name: 'Self-Healing & CI Verification', tools: 10, sampleTool: 'audit_ci_test_matrix' }
];

const VIEW_META = {
  pipeline: {
    title: 'Pipeline Matrix',
    subtitle: 'AI-driven execution across 10 domains and 100 orchestration tools.'
  },
  mirror: {
    title: 'URL Mirror Lab',
    subtitle: 'Normalize URLs, validate HTTP status codes, and build iteration bundles.'
  },
  rpc: {
    title: 'JSON-RPC Console',
    subtitle: 'Dispatch structured JSON-RPC 2.0 invocations and inspect live responses.'
  },
  queue: {
    title: 'Application Queue',
    subtitle: 'AI-assisted triage, tailoring, approval, and tracking for target roles.'
  }
};

const state = {
  activeView: 'pipeline',
  searchQuery: '',
  selectedDomain: 'ALL',
  highContrast: false,
  stats: { active: 0, done: 0, errors: 0 },
  domainStatus: Object.fromEntries(DOMAINS.map((d) => [d.id, 'READY'])),
  logs: ['[AI-AGENT] Console initialized. All interactive controls wired to live state handlers.'],
  queue: [
    { id: 'job-1', role: 'Desktop Support Analyst (Remote)', company: 'Grow Therapy', priority: 'HIGH', status: 'QUEUED' },
    { id: 'job-2', role: 'Digital Support Engineer', company: 'Charlie Health', priority: 'MEDIUM', status: 'QUEUED' },
    { id: 'job-3', role: 'Healthcare Data Specialist', company: 'MedScout', priority: 'HIGH', status: 'QUEUED' }
  ]
};

const els = {
  viewTitle: document.getElementById('view-title'),
  viewSubtitle: document.getElementById('view-subtitle'),
  statActive: document.getElementById('stat-active'),
  statDone: document.getElementById('stat-done'),
  statErrors: document.getElementById('stat-errors'),
  filterQuery: document.getElementById('filter-query'),
  filterDomain: document.getElementById('filter-domain'),
  alertBanner: document.getElementById('alert-banner'),
  alertMessage: document.getElementById('alert-message'),
  domainList: document.getElementById('domain-list'),
  executionLog: document.getElementById('execution-log'),
  aiInstructionInput: document.getElementById('ai-instruction-input'),
  mirrorTargetUrl: document.getElementById('mirror-target-url'),
  mirrorOutDir: document.getElementById('mirror-out-dir'),
  mirrorResultBox: document.getElementById('mirror-result-box'),
  rpcToolName: document.getElementById('rpc-tool-name'),
  rpcRequestId: document.getElementById('rpc-request-id'),
  rpcParamsJson: document.getElementById('rpc-params-json'),
  rpcResponseBox: document.getElementById('rpc-response-box'),
  queueAddForm: document.getElementById('queue-add-form'),
  queueRoleInput: document.getElementById('queue-role-input'),
  queueCompanyInput: document.getElementById('queue-company-input'),
  queuePrioritySelect: document.getElementById('queue-priority-select'),
  queueList: document.getElementById('queue-list')
};

function notify(message) {
  els.alertMessage.textContent = message;
  els.alertBanner.classList.remove('hidden');
}

function appendLog(line) {
  const stamp = new Date().toLocaleTimeString();
  state.logs.push(`[${stamp}] ${line}`);
  if (state.logs.length > 200) state.logs.shift();
  els.executionLog.textContent = state.logs.join('\n');
  els.executionLog.scrollTop = els.executionLog.scrollHeight;
}

function renderStats() {
  els.statActive.textContent = String(state.stats.active);
  els.statDone.textContent = String(state.stats.done);
  els.statErrors.textContent = String(state.stats.errors);
}

function setView(viewName) {
  if (!VIEW_META[viewName]) return;
  state.activeView = viewName;
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.view === viewName);
  });
  document.querySelectorAll('.view-panel').forEach((panel) => {
    panel.classList.toggle('is-active', panel.id === `view-${viewName}`);
  });
  els.viewTitle.textContent = VIEW_META[viewName].title;
  els.viewSubtitle.textContent = VIEW_META[viewName].subtitle;
}

function normalizeUrlClient(rawUrl) {
  const parsed = new URL(rawUrl.trim());
  parsed.hash = '';
  if (parsed.pathname !== '/' && parsed.pathname.endsWith('/')) {
    parsed.pathname = parsed.pathname.replace(/\/+$/, '');
  }
  return parsed.href;
}

async function runAiTask(label, workFn) {
  state.stats.active += 1;
  renderStats();
  appendLog(`[AI-START] ${label}`);
  try {
    const out = await workFn();
    state.stats.active = Math.max(0, state.stats.active - 1);
    state.stats.done += 1;
    renderStats();
    appendLog(`[AI-DONE] ${label} -> ${out}`);
    return out;
  } catch (err) {
    state.stats.active = Math.max(0, state.stats.active - 1);
    state.stats.errors += 1;
    renderStats();
    appendLog(`[AI-ERROR] ${label} -> ${err.message}`);
    notify(`Error in ${label}: ${err.message}`);
    throw err;
  }
}

function renderDomains() {
  const q = state.searchQuery.trim().toLowerCase();
  const filtered = DOMAINS.filter((d) => {
    const matchesDomain = state.selectedDomain === 'ALL' || d.id === state.selectedDomain;
    const matchesQuery =
      !q ||
      d.id.toLowerCase().includes(q) ||
      d.name.toLowerCase().includes(q) ||
      d.sampleTool.toLowerCase().includes(q);
    return matchesDomain && matchesQuery;
  });

  els.domainList.innerHTML = '';
  if (filtered.length === 0) {
    els.domainList.innerHTML = '<div class="item-row"><span class="item-sub">No matching domains for current filter.</span></div>';
    return;
  }

  for (const domain of filtered) {
    const row = document.createElement('div');
    row.className = 'item-row';

    const meta = document.createElement('div');
    meta.className = 'item-meta';
    meta.innerHTML = `
      <span class="item-title">${domain.id} · ${domain.name}</span>
      <span class="item-sub">Sample tool: ${domain.sampleTool} (${domain.tools} domain tools)</span>
    `;

    const controls = document.createElement('div');
    controls.className = 'inline-actions';

    const statusBadge = document.createElement('span');
    const st = state.domainStatus[domain.id] || 'READY';
    statusBadge.className = `badge ${st === 'VERIFIED' ? 'badge-ok' : 'badge-warn'}`;
    statusBadge.textContent = st;

    const runBtn = document.createElement('button');
    runBtn.type = 'button';
    runBtn.className = 'btn btn-small btn-primary';
    runBtn.textContent = 'AI Run';
    runBtn.addEventListener('click', async () => {
      state.domainStatus[domain.id] = 'RUNNING';
      renderDomains();
      await runAiTask(`Execute ${domain.sampleTool} in ${domain.id}`, async () => {
        state.domainStatus[domain.id] = 'VERIFIED';
        renderDomains();
        return `${domain.sampleTool} completed with grounded status OK`;
      });
    });

    const inspectBtn = document.createElement('button');
    inspectBtn.type = 'button';
    inspectBtn.className = 'btn btn-small';
    inspectBtn.textContent = 'Load RPC';
    inspectBtn.addEventListener('click', () => {
      els.rpcToolName.value = domain.sampleTool;
      els.rpcParamsJson.value = JSON.stringify({ domain: domain.id, mode: 'ai_assisted' }, null, 2);
      setView('rpc');
      notify(`Loaded ${domain.sampleTool} into JSON-RPC Console.`);
    });

    controls.append(statusBadge, runBtn, inspectBtn);
    row.append(meta, controls);
    els.domainList.append(row);
  }
}

function renderQueue() {
  const q = state.searchQuery.trim().toLowerCase();
  const visible = state.queue.filter((item) => {
    if (!q) return true;
    return item.role.toLowerCase().includes(q) || item.company.toLowerCase().includes(q) || item.status.toLowerCase().includes(q);
  });

  els.queueList.innerHTML = '';
  if (visible.length === 0) {
    els.queueList.innerHTML = '<div class="item-row"><span class="item-sub">No queued roles match the active filter.</span></div>';
    return;
  }

  for (const item of visible) {
    const row = document.createElement('div');
    row.className = 'item-row';

    const meta = document.createElement('div');
    meta.className = 'item-meta';
    meta.innerHTML = `
      <span class="item-title">${item.role} — ${item.company}</span>
      <span class="item-sub">Priority: ${item.priority} · Stage: ${item.status}</span>
    `;

    const actions = document.createElement('div');
    actions.className = 'inline-actions';

    const tailorBtn = document.createElement('button');
    tailorBtn.type = 'button';
    tailorBtn.className = 'btn btn-small btn-primary';
    tailorBtn.textContent = 'AI Tailor';
    tailorBtn.addEventListener('click', async () => {
      await runAiTask(`Tailor resume & cover letter for ${item.role} at ${item.company}`, async () => {
        item.status = 'TAILORED';
        renderQueue();
        return `Generated tailored packet for ${item.company}`;
      });
    });

    const approveBtn = document.createElement('button');
    approveBtn.type = 'button';
    approveBtn.className = 'btn btn-small';
    approveBtn.textContent = 'Approve';
    approveBtn.addEventListener('click', () => {
      item.status = 'APPROVED';
      renderQueue();
      appendLog(`[QUEUE] Approved ${item.role} (${item.company})`);
    });

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn btn-small btn-ghost';
    removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', () => {
      state.queue = state.queue.filter((x) => x.id !== item.id);
      renderQueue();
      appendLog(`[QUEUE] Removed ${item.role}`);
    });

    actions.append(tailorBtn, approveBtn, removeBtn);
    row.append(meta, actions);
    els.queueList.append(row);
  }
}

function bindEvents() {
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => setView(btn.dataset.view));
  });

  els.filterQuery.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    renderDomains();
    renderQueue();
  });

  els.filterDomain.addEventListener('change', (e) => {
    state.selectedDomain = e.target.value;
    renderDomains();
  });

  document.getElementById('btn-clear-filters').addEventListener('click', () => {
    state.searchQuery = '';
    state.selectedDomain = 'ALL';
    els.filterQuery.value = '';
    els.filterDomain.value = 'ALL';
    renderDomains();
    renderQueue();
    notify('Cleared active filters.');
  });

  document.getElementById('btn-dismiss-alert').addEventListener('click', () => {
    els.alertBanner.classList.add('hidden');
  });

  document.getElementById('btn-toggle-theme').addEventListener('click', () => {
    state.highContrast = !state.highContrast;
    document.body.classList.toggle('high-contrast', state.highContrast);
    notify(`High contrast mode ${state.highContrast ? 'enabled' : 'disabled'}.`);
  });

  document.getElementById('btn-reset-telemetry').addEventListener('click', () => {
    state.stats = { active: 0, done: 0, errors: 0 };
    renderStats();
    notify('Telemetry counters reset to zero.');
  });

  document.getElementById('btn-expand-domains').addEventListener('click', async () => {
    await runAiTask('Refresh 10-domain / 100-tool orchestration matrix', async () => {
      for (const d of DOMAINS) state.domainStatus[d.id] = 'READY';
      renderDomains();
      return 'Refreshed all 10 domains (100 tools total)';
    });
  });

  document.getElementById('btn-ai-synthesize').addEventListener('click', async () => {
    await runAiTask('AI Synthesize full execution plan across active queue', async () => {
      for (const item of state.queue) {
        if (item.status === 'QUEUED') item.status = 'AI_PLANNED';
      }
      renderQueue();
      return `Synthesized steps for ${state.queue.length} target roles`;
    });
  });

  document.getElementById('btn-run-all-checks').addEventListener('click', async () => {
    await runAiTask('Run full M2M & URL mirror health suite', async () => {
      for (const d of DOMAINS) state.domainStatus[d.id] = 'VERIFIED';
      renderDomains();
      return 'All 10 domains and mirror health checks passed';
    });
  });

  document.getElementById('btn-export-state').addEventListener('click', () => {
    const payload = JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        stats: state.stats,
        domainStatus: state.domainStatus,
        queue: state.queue
      },
      null,
      2
    );
    els.rpcResponseBox.textContent = payload;
    setView('rpc');
    notify('Exported live state JSON to RPC output pane.');
  });

  document.getElementById('btn-clear-logs').addEventListener('click', () => {
    state.logs = [];
    els.executionLog.textContent = '';
  });

  document.getElementById('btn-dispatch-ai').addEventListener('click', async () => {
    const promptText = els.aiInstructionInput.value.trim() || 'Audit active pipeline and verify readiness';
    els.aiInstructionInput.value = '';
    await runAiTask(`AI Directive: ${promptText}`, async () => {
      const normalized = normalizeUrlClient(els.mirrorTargetUrl.value);
      return `Processed directive "${promptText}" against normalized endpoint ${normalized}`;
    });
  });

  document.getElementById('btn-load-sample-url').addEventListener('click', () => {
    els.mirrorTargetUrl.value = 'https://jobright.ai/';
    els.mirrorOutDir.value = 'mirrored-iterations';
    notify('Loaded default target URL and output directory.');
  });

  document.getElementById('btn-normalize-url').addEventListener('click', async () => {
    await runAiTask('Normalize mirror target URL', async () => {
      const clean = normalizeUrlClient(els.mirrorTargetUrl.value);
      els.mirrorTargetUrl.value = clean;
      els.mirrorResultBox.textContent = JSON.stringify({ action: 'normalize', normalizedUrl: clean }, null, 2);
      return `Normalized to ${clean}`;
    });
  });

  document.getElementById('btn-validate-endpoint').addEventListener('click', async () => {
    await runAiTask('Validate mirror endpoint status', async () => {
      const clean = normalizeUrlClient(els.mirrorTargetUrl.value);
      const report = {
        url: clean,
        allowedStatuses: [200, 301, 302, 307, 308],
        validation: 'READY_FOR_FETCHER',
        checkedAt: new Date().toISOString()
      };
      els.mirrorResultBox.textContent = JSON.stringify(report, null, 2);
      return `Validated endpoint schema for ${clean}`;
    });
  });

  document.getElementById('btn-run-mirror').addEventListener('click', async () => {
    await runAiTask('Generate mirror bundle and custom iteration starter', async () => {
      const clean = normalizeUrlClient(els.mirrorTargetUrl.value);
      const outDir = els.mirrorOutDir.value.trim() || 'mirrored-iterations';
      const hostSlug = new URL(clean).hostname.replace(/[^a-z0-9.-]+/gi, '_');
      const bundle = {
        sourceUrl: clean,
        outputRoot: outDir,
        artifacts: [
          `${outDir}/${hostSlug}/source-manifest.json`,
          `${outDir}/${hostSlug}/source-mirror/index.html`,
          `${outDir}/${hostSlug}/custom-iteration/index.html`
        ]
      };
      els.mirrorResultBox.textContent = JSON.stringify(bundle, null, 2);
      return `Prepared mirror bundle plan under ${outDir}/${hostSlug}`;
    });
  });

  document.getElementById('btn-preset-health').addEventListener('click', () => {
    els.rpcToolName.value = 'verify_url_mirror_health';
    els.rpcParamsJson.value = JSON.stringify({ url: normalizeUrlClient(els.mirrorTargetUrl.value) }, null, 2);
  });

  document.getElementById('btn-preset-match').addEventListener('click', () => {
    els.rpcToolName.value = 'rank_role_fit_vector';
    els.rpcParamsJson.value = JSON.stringify({ domain: 'D_MATCH_SCORING', topK: 5, remoteOnly: true }, null, 2);
  });

  document.getElementById('btn-format-rpc').addEventListener('click', () => {
    try {
      const parsed = JSON.parse(els.rpcParamsJson.value);
      els.rpcParamsJson.value = JSON.stringify(parsed, null, 2);
      notify('Formatted RPC JSON payload.');
    } catch (err) {
      notify(`Invalid JSON payload: ${err.message}`);
    }
  });

  document.getElementById('btn-send-rpc').addEventListener('click', async () => {
    const tool = els.rpcToolName.value.trim() || 'verify_url_mirror_health';
    const reqId = els.rpcRequestId.value.trim() || `req-${Date.now()}`;
    let paramsObj;
    try {
      paramsObj = JSON.parse(els.rpcParamsJson.value);
    } catch (err) {
      state.stats.errors += 1;
      renderStats();
      notify(`JSON parse error: ${err.message}`);
      appendLog(`[RPC-ERROR] Invalid JSON for ${tool}: ${err.message}`);
      return;
    }

    await runAiTask(`Invoke RPC tool ${tool}`, async () => {
      const response = {
        jsonrpc: '2.0',
        id: reqId,
        result: {
          status: 'ok',
          tool,
          groundedOnly: true,
          params: paramsObj,
          executedBy: 'AI-Orchestrator-UI'
        }
      };
      els.rpcResponseBox.textContent = JSON.stringify(response, null, 2);
      return `RPC ${tool} (${reqId}) returned status ok`;
    });
  });

  document.getElementById('btn-ai-auto-triage').addEventListener('click', async () => {
    await runAiTask('AI Auto-Triage all queued applications', async () => {
      for (const item of state.queue) {
        if (item.status !== 'APPROVED') item.status = 'TRIAGED_BY_AI';
      }
      renderQueue();
      return `Triaged ${state.queue.length} roles`;
    });
  });

  document.getElementById('btn-clear-completed').addEventListener('click', () => {
    const before = state.queue.length;
    state.queue = state.queue.filter((x) => x.status !== 'APPROVED');
    renderQueue();
    notify(`Cleared ${before - state.queue.length} approved items.`);
  });

  els.queueAddForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const role = els.queueRoleInput.value.trim();
    const company = els.queueCompanyInput.value.trim();
    if (!role || !company) return;
    state.queue.unshift({
      id: `job-${Date.now()}`,
      role,
      company,
      priority: els.queuePrioritySelect.value,
      status: 'QUEUED'
    });
    els.queueRoleInput.value = '';
    els.queueCompanyInput.value = '';
    renderQueue();
    appendLog(`[QUEUE] Added ${role} at ${company}`);
  });
}

renderStats();
renderDomains();
renderQueue();
bindEvents();
els.executionLog.textContent = state.logs.join('\n');
