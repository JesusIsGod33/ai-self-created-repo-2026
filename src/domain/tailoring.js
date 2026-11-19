import { extractRequirements, mapRequirements } from './requirements.js';
import { buildTailoredDraft } from './tailoring/builder.js';

function isVerified(record) {
  return Boolean(record && typeof record === 'object' && record.verificationStatus === 'verified');
}

export function buildTailoredResume(profileOrInput, maybeJd, maybeCtx) {
  let profile = profileOrInput;
  let jobDescription = maybeJd;
  let analysis = maybeCtx;

  if (
    profileOrInput &&
    typeof profileOrInput === 'object' &&
    !Array.isArray(profileOrInput) &&
    !profileOrInput.roles &&
    !profileOrInput.skills &&
    (profileOrInput.profile || profileOrInput.jobDescription || profileOrInput.analysis)
  ) {
    profile = profileOrInput.profile || {};
    jobDescription = profileOrInput.jobDescription || '';
    analysis = profileOrInput.analysis || null;
  }

  const jdText =
    typeof jobDescription === 'string'
      ? jobDescription
      : String(jobDescription?.text || jobDescription?.description || '');

  const requirements = Array.isArray(analysis?.requirements)
    ? analysis.requirements
    : extractRequirements(jdText);
  const mapped = Array.isArray(analysis?.mapped)
    ? analysis.mapped
    : Array.isArray(analysis?.mapping)
      ? analysis.mapping
      : mapRequirements(profile || {}, requirements);

  const verifiedSkills = (Array.isArray(profile?.skills) ? profile.skills : []).filter(isVerified);
  const verifiedTools = (Array.isArray(profile?.tools) ? profile.tools : []).filter(isVerified);
  const verifiedRoles = (Array.isArray(profile?.roles) ? profile.roles : [])
    .filter(isVerified)
    .map((role) => ({
      ...role,
      accomplishments: (Array.isArray(role.accomplishments) ? role.accomplishments : [])
        .filter(isVerified)
        .map((acc) => ({
          ...acc,
          evidenceId: acc.evidenceId || acc.id || null
        }))
    }));

  const verifiedSummaries = (Array.isArray(profile?.summaryVariants) ? profile.summaryVariants : []).filter(isVerified);
  const summary =
    verifiedSummaries[0]?.text ||
    verifiedSummaries[0]?.summary ||
    (typeof profile?.headline === 'string' ? profile.headline : '') ||
    (verifiedRoles[0]?.title ? `${verifiedRoles[0].title} grounded in verified experience.` : 'Grounded candidate profile.');

  return {
    contact: profile?.contact || null,
    headline: summary,
    summary,
    roles: verifiedRoles,
    skills: verifiedSkills,
    tools: verifiedTools,
    certifications: (Array.isArray(profile?.certifications) ? profile.certifications : []).filter(isVerified),
    education: (Array.isArray(profile?.education) ? profile.education : []).filter(isVerified),
    projects: (Array.isArray(profile?.projects) ? profile.projects : []).filter(isVerified),
    mapping: mapped,
    provenancePolicy: 'strict-verified-only',
    jobDescription: jdText
  };
}

export function toPlainText(draft) {
  if (!draft) return '';
  if (typeof draft === 'string') return draft;
  const parts = [];
  if (draft.contact?.name) parts.push(String(draft.contact.name));
  if (draft.summary) parts.push(String(draft.summary));
  for (const role of Array.isArray(draft.roles) ? draft.roles : []) {
    if (role.title) parts.push([role.title, role.company, role.period].filter(Boolean).join(' - '));
    for (const acc of Array.isArray(role.accomplishments) ? role.accomplishments : []) {
      const text = typeof acc === 'string' ? acc : acc?.text || acc?.statement || '';
      if (text) parts.push(text);
    }
  }
  for (const sk of Array.isArray(draft.skills) ? draft.skills : []) {
    const label = typeof sk === 'string' ? sk : sk?.name || sk?.label || '';
    if (label) parts.push(label);
  }
  return parts.join('\n').trim();
}

export { buildTailoredDraft };
export default { buildTailoredResume, buildTailoredDraft, toPlainText };
