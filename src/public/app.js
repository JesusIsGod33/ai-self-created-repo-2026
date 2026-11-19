import { renderProfile } from './ui/profile-view.js';
import { renderAnalysis } from './ui/alignment-view.js';
import { renderDraft } from './ui/draft-view.js';
import { renderAts } from './ui/ats-view.js';
import {
  buildSkillGraph,
  generateCoverLetter,
  buildInterviewAndCompPlan
} from '../domain/automation/studio-engine.js';

function esc(val) {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const el = {
  verifiedCount: document.getElementById('verified-count'),
  readinessBadge: document.getElementById('readiness-badge'),
  status: document.getElementById('status'),
  profile: document.getElementById('profile-content'),
  jd: document.getElementById('job-description'),
  analyzeBtn: document.getElementById('analyze-btn'),
  tailorBtn: document.getElementById('tailor-btn'),
  exportBtn: document.getElementById('export-btn'),
  exportFormat: document.getElementById('export-format'),
  alignment: document.getElementById('alignment-output'),
  draft: document.getElementById('draft-output'),
  ats: document.getElementById('ats-output'),
  rawEvidenceInput: document.getElementById('raw-evidence-input'),
  parseEvidenceBtn: document.getElementById('parse-evidence-btn'),
  parsedEvidenceOutput: document.getElementById('parsed-evidence-output'),
  skillGraphOutput: document.getElementById('skill-graph-output'),
  companyInput: document.getElementById('company-input'),
  toneSelect: document.getElementById('tone-select'),
  generateLetterBtn: document.getElementById('generate-letter-btn'),
  coverLetterOutput: document.getElementById('cover-letter-output'),
  jobTitleInput: document.getElementById('job-title-input'),
  jobCompanyInput: document.getElementById('job-company-input'),
  addJobBtn: document.getElementById('add-job-btn'),
  pipelineList: document.getElementById('pipeline-list'),
  screeningQuestionInput: document.getElementById('screening-question-input'),
  answerScreeningBtn: document.getElementById('answer-screening-btn'),
  screeningAnswerOutput: document.getElementById('screening-answer-output'),
  starPromptsOutput: document.getElementById('star-prompts-output'),
  compRoleInput: document.getElementById('comp-role-input'),
  compLocationInput: document.getElementById('comp-location-input'),
  compTargetInput: document.getElementById('comp-target-input'),
  calcCompBtn: document.getElementById('calc-comp-btn'),
  compOutput: document.getElementById('comp-output')
};

let state = {
  profile: null,
  analysis: null,
  draft: null,
  ats: null,
  jobs: []
};

function setStatus(msg) {
  if (el.status) el.status.textContent = msg;
}

function getVerifiedSkills(profile) {
  const skills = Array.isArray(profile?.skills) ? profile.skills : [];
  return skills.filter((s) => s && s.verificationStatus === 'verified');
}

function refreshAuxViews() {
  if (!state.profile) return;
  const graph = buildSkillGraph(state.profile, el.jd?.value || '');
  if (el.readinessBadge) el.readinessBadge.textContent = `Match: ${graph.readinessScore}%`;
  if (el.skillGraphOutput) {
    el.skillGraphOutput.innerHTML = `
      <p><strong>JD Alignment Score:</strong> ${esc(graph.readinessScore)}%</p>
      <p><strong>Hard Skills:</strong> ${esc(graph.hardSkills.join(', ') || 'None')}</p>
      <p><strong>Verified Tools:</strong> ${esc(graph.tools.join(', ') || 'None')}</p>
      <p><strong>Matched JD Terms:</strong> ${esc(graph.matchedKeywords.join(', ') || 'None')}</p>
      <p><strong>Gap Terms to Review:</strong> ${esc(graph.gapKeywords.join(', ') || 'None')}</p>
    `;
  }

  const plan = buildInterviewAndCompPlan({
    profile: state.profile,
    jobDescription: el.jd?.value || '',
    roleTitle: el.compRoleInput?.value || 'Target Role',
    location: el.compLocationInput?.value || 'Remote / US',
    targetComp: el.compTargetInput?.value || 95000
  });

  if (el.starPromptsOutput) {
    el.starPromptsOutput.innerHTML = plan.starPrompts.length
      ? `<ul class="item-list">${plan.starPrompts
          .map(
            (p) =>
              `<li><strong>${esc(p.role)}</strong> [${esc(p.evidenceId)}]: ${esc(p.prompt)}</li>`
          )
          .join('')}</ul>`
      : '<p>No verified accomplishments available yet.</p>';
  }
}

document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const target = btn.getAttribute('data-tab');
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
    btn.classList.add('active');
    const panel = document.getElementById(`tab-${target}`);
    if (panel) panel.classList.add('active');
    refreshAuxViews();
  });
});

async function loadProfile() {
  setStatus('Loading verified profile…');
  const res = await fetch('/api/profile');
  const data = await res.json();
  const profile = data?.profile && typeof data.profile === 'object' ? data.profile : data || {};
  state.profile = profile;
  const verifiedSkills = getVerifiedSkills(profile);
  if (el.verifiedCount) el.verifiedCount.textContent = `${verifiedSkills.length} verified skills`;
  if (el.profile) el.profile.innerHTML = renderProfile(data);
  refreshAuxViews();
  setStatus('Ready.');
}

el.analyzeBtn?.addEventListener('click', async () => {
  setStatus('Analyzing alignment…');
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobDescription: el.jd?.value || '', profile: state.profile })
  });
  const data = await res.json();
  state.analysis = data?.analysis || data;
  if (el.alignment) el.alignment.innerHTML = renderAnalysis(state.analysis);
  refreshAuxViews();
  setStatus('Alignment complete.');
});

el.tailorBtn?.addEventListener('click', async () => {
  setStatus('Building provenance-locked draft…');
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
  refreshAuxViews();
  setStatus('Draft & ATS audit ready.');
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
  const content = typeof data === 'string' ? data : data?.content ?? JSON.stringify(data, null, 2);
  if (el.draft) {
    el.draft.innerHTML = `<pre style="white-space:pre-wrap;margin:0;">${esc(content)}</pre>`;
  }
  setStatus(`Exported ${format}.`);
});

el.parseEvidenceBtn?.addEventListener('click', () => {
  const raw = String(el.rawEvidenceInput?.value || '').trim();
  const lines = raw
    .split(/\n+|(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8);
  if (!el.parsedEvidenceOutput) return;
  if (!lines.length) {
    el.parsedEvidenceOutput.innerHTML = '<p>Paste career notes or metrics above to extract candidate items.</p>';
    return;
  }
  el.parsedEvidenceOutput.innerHTML = `
    <p><strong>Extracted Draft Candidates (${lines.length}) — Pending Verification Lock:</strong></p>
    <ul class="item-list">
      ${lines.map((line, i) => `<li><span class="tag-warn">[UNVERIFIED CANDIDATE #${i + 1}]</span> ${esc(line)}</li>`).join('')}
    </ul>
  `;
  setStatus('Structured raw evidence candidates.');
});

el.generateLetterBtn?.addEventListener('click', () => {
  const out = generateCoverLetter({
    profile: state.profile || {},
    jobDescription: el.jd?.value || '',
    tone: el.toneSelect?.value || 'executive',
    company: el.companyInput?.value || 'Target Team'
  });
  if (el.coverLetterOutput) {
    el.coverLetterOutput.innerHTML = `<pre style="white-space:pre-wrap;margin:0;">${esc(out.letter)}</pre>`;
  }
  setStatus('Generated grounded cover letter.');
});

el.addJobBtn?.addEventListener('click', () => {
  const title = String(el.jobTitleInput?.value || '').trim();
  const company = String(el.jobCompanyInput?.value || '').trim();
  if (!title && !company) return;
  const graph = buildSkillGraph(state.profile || {}, `${title} ${company} ${el.jd?.value || ''}`);
  state.jobs.push({
    title: title || 'Target Role',
    company: company || 'Company',
    score: graph.readinessScore,
    stage: 'Queued / Review'
  });
  if (el.pipelineList) {
    el.pipelineList.innerHTML = `<ul class="item-list">${state.jobs
      .map(
        (j) =>
          `<li><strong>${esc(j.title)}</strong> at <strong>${esc(j.company)}</strong> — <span class="tag-pass">${esc(j.score)}% fit</span> (${esc(j.stage)})</li>`
      )
      .join('')}</ul>`;
  }
  if (el.jobTitleInput) el.jobTitleInput.value = '';
  if (el.jobCompanyInput) el.jobCompanyInput.value = '';
  setStatus('Added scored opportunity to tracker.');
});

el.answerScreeningBtn?.addEventListener('click', () => {
  const question = String(el.screeningQuestionInput?.value || '').trim();
  const roles = Array.isArray(state.profile?.roles)
    ? state.profile.roles.filter((r) => r && r.verificationStatus === 'verified')
    : [];
  const firstBullet = roles
    .flatMap((r) => (Array.isArray(r.accomplishments) ? r.accomplishments : []))
    .filter((b) => b && b.verificationStatus === 'verified')
    .map((b) => b.text || b.statement)
    .find(Boolean);

  if (el.screeningAnswerOutput) {
    el.screeningAnswerOutput.innerHTML = `<p><strong>Question:</strong> ${esc(question || 'General role prompt')}</p><p><strong>Grounded Response:</strong> Drawing directly from verified records, ${esc(firstBullet || 'prioritized cross-functional execution using documented workflows and measurable results.')}</p>`;
  }
  setStatus('Drafted grounded screening response.');
});

el.calcCompBtn?.addEventListener('click', () => {
  const plan = buildInterviewAndCompPlan({
    profile: state.profile || {},
    jobDescription: el.jd?.value || '',
    roleTitle: el.compRoleInput?.value || 'Target Role',
    location: el.compLocationInput?.value || 'Remote / US',
    targetComp: el.compTargetInput?.value || 95000
  });
  if (el.compOutput) {
    el.compOutput.innerHTML = `
      <p><strong>Baseline Target:</strong> $${esc(plan.compensation.baselineTarget.toLocaleString())}</p>
      <p><strong>Counter-Offer Anchor (+12%):</strong> <span class="tag-pass">$${esc(plan.compensation.counterOfferAnchor.toLocaleString())}</span></p>
      <p><strong>Floor Threshold (-6%):</strong> $${esc(plan.compensation.floorThreshold.toLocaleString())}</p>
      <p><strong>Script:</strong> ${esc(plan.compensation.negotiationScript)}</p>
    `;
  }
  setStatus('Calculated compensation anchors.');
});

loadProfile().catch((err) => {
  setStatus(`Error: ${err.message}`);
});
