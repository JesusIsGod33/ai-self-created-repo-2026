import { extractRequirements, mapRequirements } from '../requirements.js';

function isVerified(record) {
  return Boolean(record && typeof record === 'object' && record.verificationStatus === 'verified');
}

function normalizeBullet(item, fallbackSource = 'verified-profile') {
  if (!item || typeof item !== 'object') return null;
  const text = String(item.text || item.statement || item.description || item.summary || '').trim();
  if (!text) return null;
  const verifiedId = item.id || item.evidenceId || null;
  if (!verifiedId) return null;
  return {
    ...item,
    id: verifiedId,
    evidenceId: verifiedId,
    text,
    source: item.source || fallbackSource,
    verificationStatus: 'verified'
  };
}

export function buildTailoredDraft(firstArg, secondArg, thirdArg) {
  let profile = {};
  let jobDescription = '';
  let analysis = null;

  if (
    firstArg &&
    typeof firstArg === 'object' &&
    !Array.isArray(firstArg) &&
    !Array.isArray(firstArg.roles) &&
    !Array.isArray(firstArg.skills) &&
    (firstArg.profile || firstArg.jobDescription || firstArg.analysis)
  ) {
    profile = firstArg.profile && typeof firstArg.profile === 'object' ? firstArg.profile : {};
    jobDescription =
      typeof firstArg.jobDescription === 'string'
        ? firstArg.jobDescription
        : String(firstArg.jobDescription?.text || firstArg.jobDescription?.description || '');
    analysis = firstArg.analysis || null;
  } else {
    profile = firstArg && typeof firstArg === 'object' ? firstArg : {};
    if (typeof secondArg === 'string') {
      jobDescription = secondArg;
      analysis = thirdArg && typeof thirdArg === 'object' ? thirdArg : null;
    } else if (secondArg && typeof secondArg === 'object') {
      if (Array.isArray(secondArg.requirements) || Array.isArray(secondArg.mapped) || Array.isArray(secondArg.mapping)) {
        analysis = secondArg;
        jobDescription = typeof thirdArg === 'string' ? thirdArg : '';
      } else {
        jobDescription = String(secondArg.text || secondArg.description || '');
        analysis = thirdArg && typeof thirdArg === 'object' ? thirdArg : null;
      }
    } else if (typeof thirdArg === 'string') {
      jobDescription = thirdArg;
    }
  }

  const requirements = Array.isArray(analysis?.requirements)
    ? analysis.requirements
    : extractRequirements(jobDescription);
  const mapped = Array.isArray(analysis?.mapped)
    ? analysis.mapped
    : Array.isArray(analysis?.mapping)
      ? analysis.mapping
      : mapRequirements(profile, requirements);

  const verifiedSkills = (Array.isArray(profile.skills) ? profile.skills : [])
    .filter(isVerified)
    .map((s) => ({
      ...s,
      id: s.id,
      name: s.name || s.label || s.text || '',
      source: s.source || 'verified-profile',
      verificationStatus: 'verified'
    }))
    .filter((s) => Boolean(s.name && s.id));

  const verifiedTools = (Array.isArray(profile.tools) ? profile.tools : [])
    .filter(isVerified)
    .map((t) => ({
      ...t,
      id: t.id,
      name: t.name || t.label || t.text || '',
      source: t.source || 'verified-profile',
      verificationStatus: 'verified'
    }))
    .filter((t) => Boolean(t.name && t.id));

  const verifiedRoles = (Array.isArray(profile.roles) ? profile.roles : [])
    .filter(isVerified)
    .map((role) => {
      const accomplishments = (Array.isArray(role.accomplishments) ? role.accomplishments : [])
        .filter(isVerified)
        .map((acc) => normalizeBullet(acc, role.source || role.id || 'role'))
        .filter(Boolean);

      return {
        ...role,
        id: role.id,
        title: role.title || '',
        company: role.company || '',
        location: role.location || '',
        period: role.period || role.dates || '',
        source: role.source || 'verified-profile',
        verificationStatus: 'verified',
        accomplishments
      };
    })
    .filter((role) => Boolean(role.id));

  const verifiedSummaries = (Array.isArray(profile.summaryVariants) ? profile.summaryVariants : []).filter(isVerified);
  const chosenSummary = verifiedSummaries[0] || null;
  const headline =
    chosenSummary?.text ||
    chosenSummary?.summary ||
    (typeof profile.headline === 'string' ? profile.headline : '') ||
    (verifiedRoles[0]?.title ? `${verifiedRoles[0].title} grounded in verified experience.` : 'Grounded candidate profile.');

  const summaryRecord = chosenSummary
    ? {
        ...chosenSummary,
        id: chosenSummary.id,
        source: chosenSummary.source || 'verified-profile',
        verificationStatus: 'verified',
        text: headline
      }
    : undefined;

  return {
    contact: profile.contact || null,
    headline,
    summary: headline,
    ...(summaryRecord ? { summaryRecord } : {}),
    roles: verifiedRoles,
    skills: verifiedSkills,
    tools: verifiedTools,
    certifications: (Array.isArray(profile.certifications) ? profile.certifications : []).filter(
      (c) => isVerified(c) && c.id && c.source
    ),
    education: (Array.isArray(profile.education) ? profile.education : []).filter(
      (e) => isVerified(e) && e.id && e.source
    ),
    projects: (Array.isArray(profile.projects) ? profile.projects : []).filter(
      (p) => isVerified(p) && p.id && p.source
    ),
    mapping: mapped,
    groundedOnly: true,
    provenancePolicy: 'strict-verified-only',
    jobDescription
  };
}

export const buildDraft = buildTailoredDraft;
export const tailorResume = buildTailoredDraft;
export default buildTailoredDraft;
