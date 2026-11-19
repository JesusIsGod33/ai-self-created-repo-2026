import { exportPlainText } from './plain-text.js';
import { exportMarkdown } from './markdown.js';
import { exportJsonBundle } from './json-bundle.js';
import { exportAuditReport } from './audit-report.js';

function normalizeFormat(format) {
  if (format && typeof format === 'object') {
    format = format.format || format.type || format.target || 'markdown';
  }
  const f = String(format || 'markdown').trim().toLowerCase();
  if (f === 'plain-text' || f === 'plain' || f === 'txt' || f === 'text') return 'text';
  if (f === 'md' || f === 'markdown') return 'markdown';
  if (f === 'json-bundle' || f === 'bundle' || f === 'json') return 'json';
  if (f === 'audit-report' || f === 'provenance-audit' || f === 'audit') return 'audit';
  return f;
}

function collectVerifiedFromProfile(profile) {
  if (!profile || typeof profile !== 'object') {
    return {
      contact: null,
      headline: '',
      roles: [],
      skills: [],
      tools: [],
      certifications: [],
      education: [],
      projects: [],
      summaryVariants: []
    };
  }

  const verifiedRoles = (Array.isArray(profile.roles) ? profile.roles : [])
    .filter((r) => !r.verificationStatus || r.verificationStatus === 'verified')
    .map((role) => ({
      ...role,
      accomplishments: (Array.isArray(role.accomplishments) ? role.accomplishments : [])
        .filter((a) => !a.verificationStatus || a.verificationStatus === 'verified')
        .map((acc) => ({
          ...acc,
          metrics: (Array.isArray(acc.metrics) ? acc.metrics : []).filter(
            (m) => !m.verificationStatus || m.verificationStatus === 'verified'
          )
        }))
    }));

  const filterVerified = (arr) =>
    (Array.isArray(arr) ? arr : []).filter((item) => !item.verificationStatus || item.verificationStatus === 'verified');

  return {
    contact: profile.contact || null,
    headline: profile.headline || '',
    roles: verifiedRoles,
    skills: filterVerified(profile.skills),
    tools: filterVerified(profile.tools),
    certifications: filterVerified(profile.certifications),
    education: filterVerified(profile.education),
    projects: filterVerified(profile.projects),
    summaryVariants: filterVerified(profile.summaryVariants)
  };
}

function renderByFormat(format, payload) {
  if (format === 'text') {
    const out = exportPlainText(payload);
    return typeof out === 'string' && out.trim().length > 0 ? out : JSON.stringify(payload.profile, null, 2);
  }
  if (format === 'markdown') {
    const out = exportMarkdown(payload);
    return typeof out === 'string' && out.trim().length > 0 ? out : JSON.stringify(payload.profile, null, 2);
  }
  if (format === 'json') {
    const bundle = exportJsonBundle(payload);
    return typeof bundle === 'string' && bundle.length > 0 ? bundle : JSON.stringify(bundle, null, 2);
  }
  if (format === 'audit') {
    const report = exportAuditReport(payload);
    return typeof report === 'string' && report.length > 0 ? report : JSON.stringify(report, null, 2);
  }
  return JSON.stringify(payload, null, 2);
}

export async function exportArtifact(input = {}) {
  const format = normalizeFormat(input?.format ?? input);
  const grounded = collectVerifiedFromProfile(input?.profile);
  const payload = {
    format,
    draft: input?.draft || null,
    profile: grounded,
    analysis: input?.analysis || null,
    jobDescription: input?.jobDescription || ''
  };
  const content = renderByFormat(format, payload);
  return {
    format,
    contentType: format === 'markdown' ? 'text/markdown; charset=utf-8' : format === 'text' ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8',
    content
  };
}

export function exportDocument(formatOrInput, profile, draft, analysis) {
  let format;
  let resolvedProfile;
  let resolvedDraft;
  let resolvedAnalysis;

  if (typeof formatOrInput === 'object' && formatOrInput !== null) {
    format = normalizeFormat(formatOrInput.format);
    resolvedProfile = formatOrInput.profile;
    resolvedDraft = formatOrInput.draft;
    resolvedAnalysis = formatOrInput.analysis;
  } else {
    format = normalizeFormat(formatOrInput);
    if (profile && typeof profile === 'object' && !profile.roles && !profile.contact && (profile.draft || profile.profile)) {
      resolvedProfile = profile.profile;
      resolvedDraft = profile.draft;
      resolvedAnalysis = profile.analysis;
    } else {
      resolvedProfile = profile;
      resolvedDraft = draft;
      resolvedAnalysis = analysis;
    }
  }

  const grounded = collectVerifiedFromProfile(resolvedProfile);
  const payload = {
    format,
    draft: resolvedDraft || null,
    profile: grounded,
    analysis: resolvedAnalysis || null,
    jobDescription: ''
  };
  return renderByFormat(format, payload);
}

export { exportPlainText, exportMarkdown, exportJsonBundle, exportAuditReport };
export const exportDraft = exportArtifact;
export const renderExport = exportArtifact;
export default exportArtifact;
