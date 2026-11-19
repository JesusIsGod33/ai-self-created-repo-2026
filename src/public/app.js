import { renderProfile } from './ui/profile-view.js';
import { renderAnalysis } from './ui/alignment-view.js';
import { renderDraft } from './ui/draft-view.js';
import { renderAts } from './ui/ats-view.js';

const el = {
  verifiedCount: document.getElementById('verified-count'),
  status: document.getElementById('status'),
  profile: document.getElementById('profile-content'),
  jd: document.getElementById('job-description'),
  analyzeBtn: document.getElementById('analyze-btn'),
  tailorBtn: document.getElementById('tailor-btn'),
  exportBtn: document.getElementById('export-btn'),
  exportFormat: document.getElementById('export-format'),
  alignment: document.getElementById('alignment-output'),
  draft: document.getElementById('draft-output'),
  ats: document.getElementById('ats-output')
};

let state = {
  profile: null,
  analysis: null,
  draft: null,
  ats: null
};

function setStatus(msg) {
  if (el.status) el.status.textContent = msg;
}

function countVerifiedSkills(payload) {
  const p = payload?.profile && typeof payload.profile === 'object' ? payload.profile : payload || {};
  const skills = Array.isArray(p.skills) ? p.skills : [];
  return skills.filter((s) => s && s.verificationStatus === 'verified').length;
}

async function loadProfile() {
  setStatus('Loading profile…');
  const res = await fetch('/api/profile');
  const data = await res.json();
  state.profile = data?.profile || data;
  const count = countVerifiedSkills(data);
  if (el.verifiedCount) el.verifiedCount.textContent = `${count} verified skills`;
  if (el.profile) el.profile.innerHTML = renderProfile(data);
  setStatus('Ready.');
}

el.analyzeBtn?.addEventListener('click', async () => {
  setStatus('Analyzing…');
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobDescription: el.jd?.value || '', profile: state.profile })
  });
  const data = await res.json();
  state.analysis = data?.analysis || data;
  if (el.alignment) el.alignment.innerHTML = renderAnalysis(state.analysis);
  setStatus('Analysis complete.');
});

el.tailorBtn?.addEventListener('click', async () => {
  setStatus('Tailoring draft…');
  const res = await fetch('/api/tailor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobDescription: el.jd?.value || '', profile: state.profile })
  });
  const data = await res.json();
  state.analysis = data?.analysis || state.analysis;
  state.draft = data?.draft || data;
  state.ats = data?.ats || null;
  if (state.analysis && el.alignment) el.alignment.innerHTML = renderAnalysis(state.analysis);
  if (el.draft) el.draft.innerHTML = renderDraft(state.draft);
  if (state.ats && el.ats) el.ats.innerHTML = renderAts(state.ats);
  setStatus('Draft & ATS ready.');
});

el.exportBtn?.addEventListener('click', async () => {
  const format = el.exportFormat?.value || 'markdown';
  setStatus(`Exporting ${format}…`);
  const res = await fetch('/api/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      format,
      profile: state.profile,
      draft: state.draft,
      analysis: state.analysis
    })
  });
  const data = await res.json();
  const text = typeof data === 'string' ? data : data?.content ?? JSON.stringify(data, null, 2);
  if (el.draft) {
    el.draft.innerHTML = `<pre style="white-space:pre-wrap;margin:0;">${String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')}</pre>`;
  }
  setStatus(`Exported ${format}.`);
});

loadProfile().catch((err) => {
  setStatus(`Error: ${err.message}`);
});
