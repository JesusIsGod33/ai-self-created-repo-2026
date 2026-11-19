export function exportPlainText(payload = {}) {
  const profile = payload.profile || {};
  const draft = payload.draft || {};
  const contact = draft.contact || profile.contact || {};
  const lines = [];

  if (contact.name) lines.push(String(contact.name).toUpperCase());
  const contactMeta = [contact.email, contact.phone, contact.location].filter(Boolean).join(' | ');
  if (contactMeta) lines.push(contactMeta);
  if (lines.length > 0) lines.push('');

  const summary = draft.summary || draft.headline || profile.headline || '';
  if (summary) {
    lines.push('SUMMARY');
    lines.push(String(summary));
    lines.push('');
  }

  const roles = Array.isArray(draft.roles) && draft.roles.length > 0
    ? draft.roles
    : Array.isArray(profile.roles)
      ? profile.roles.filter((r) => r && r.verificationStatus === 'verified')
      : [];

  if (roles.length > 0) {
    lines.push('EXPERIENCE');
    for (const role of roles) {
      const header = [role.title, role.company, role.period || role.dates].filter(Boolean).join(' — ');
      if (header) lines.push(header);
      const bullets = Array.isArray(role.accomplishments)
        ? role.accomplishments.filter((a) => !a.verificationStatus || a.verificationStatus === 'verified')
        : [];
      for (const b of bullets) {
        const text = typeof b === 'string' ? b : b.text || b.statement || b.description || '';
        const ref = typeof b === 'object' && b.source ? ` [${b.source}]` : '';
        if (text) lines.push(`- ${text}${ref}`);
      }
      lines.push('');
    }
  }

  const verifiedSkills = Array.isArray(draft.skills)
    ? draft.skills.filter((s) => !s.verificationStatus || s.verificationStatus === 'verified')
    : Array.isArray(profile.skills)
      ? profile.skills.filter((s) => s && s.verificationStatus === 'verified')
      : [];

  if (verifiedSkills.length > 0) {
    lines.push('VERIFIED SKILLS');
    lines.push(
      verifiedSkills
        .map((s) => (typeof s === 'string' ? s : s.name || s.label || ''))
        .filter(Boolean)
        .join(', ')
    );
    lines.push('');
  }

  return lines.join('\n').trim();
}

export default exportPlainText;
