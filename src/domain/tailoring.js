import { extractRequirements, mapRequirements } from './requirements.js';

function matches(text, term) {
  const source = String(text || '').toLowerCase();
  const phrase = String(term || '').toLowerCase();
  return (
    source.includes(phrase) ||
    phrase.split(/\s+/).some((word) => word.length > 3 && source.includes(word))
  );
}

function groupByRole(items) {
  const groups = new Map();
  for (const item of items) {
    const key = `${item.roleTitle}|||${item.company}|||${item.startDate}|||${item.endDate}`;
    if (!groups.has(key)) {
      groups.set(key, {
        title: item.roleTitle,
        company: item.company,
        startDate: item.startDate,
        endDate: item.endDate,
        accomplishments: []
      });
    }
    groups.get(key).accomplishments.push({
      text: item.text,
      evidenceId: item.id,
      source: item.source
    });
  }
  return [...groups.values()];
}

export function buildTailoredResume(profile, jobDescription, precomputed = {}) {
  const requirements = precomputed.requirements || extractRequirements(jobDescription);
  const mapping = precomputed.mapped || mapRequirements(profile, requirements);
  const verified = (profile?.roles || []).flatMap((role) =>
    (role.accomplishments || [])
      .filter((item) => item.verificationStatus === 'verified')
      .map((item) => ({
        ...item,
        roleTitle: role.title,
        company: role.company,
        startDate: role.startDate,
        endDate: role.endDate
      }))
  );
  const selected = verified
    .map((item) => ({
      ...item,
      relevance: requirements.reduce(
        (n, req) => n + (matches(`${item.text} ${(item.skills || []).join(' ')}`, req) ? 1 : 0),
        0
      )
    }))
    .filter((item) => item.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 8);
  const fallback = verified.slice(0, 5);
  const accomplishments = selected.length ? selected : fallback;
  const summaryVariant =
    (profile?.summaryVariants || []).find((item) => item.verificationStatus === 'verified')?.text ||
    profile?.summary ||
    '';

  return {
    title: 'Resume draft',
    generatedAt: new Date().toISOString(),
    profileName: profile?.name || '',
    contact: profile?.contact || {},
    summary: summaryVariant,
    summaryEvidence:
      (profile?.summaryVariants || []).find((item) => item.text === summaryVariant)?.source ||
      'Master profile summary',
    roles: groupByRole(accomplishments),
    skills: (profile?.skills || [])
      .filter((skill) => skill.verificationStatus === 'verified')
      .map((skill) => skill.name),
    education: (profile?.education || []).filter((item) => item.verificationStatus === 'verified'),
    certifications: (profile?.certifications || []).filter(
      (item) => item.verificationStatus === 'verified'
    ),
    mapping,
    disclaimer:
      'Draft generated exclusively from verified profile content. Confirm accuracy and relevance before use.'
  };
}

export function toPlainText(draft) {
  const contact = draft?.contact || {};
  const lines = [
    draft?.profileName || '',
    [contact.email, contact.phone, contact.location, contact.linkedin].filter(Boolean).join(' | '),
    '',
    'PROFESSIONAL SUMMARY',
    draft?.summary || '',
    '',
    'EXPERIENCE'
  ];
  for (const role of draft?.roles || []) {
    lines.push(`${role.title} — ${role.company} | ${role.startDate}–${role.endDate}`);
    for (const item of role.accomplishments || []) {
      lines.push(`• ${item.text}`);
    }
    lines.push('');
  }
  lines.push('SKILLS', (draft?.skills || []).join(' • '), '');
  if (draft?.certifications?.length) {
    lines.push('CERTIFICATIONS');
    for (const item of draft.certifications) {
      lines.push(`${item.name}${item.issuer ? ` — ${item.issuer}` : ''}`);
    }
    lines.push('');
  }
  if (draft?.education?.length) {
    lines.push('EDUCATION');
    for (const item of draft.education) {
      lines.push(`${item.degree} — ${item.institution}${item.year ? `, ${item.year}` : ''}`);
    }
  }
  return `${lines.filter((line) => line !== undefined).join('\n').trim()}\n`;
}
