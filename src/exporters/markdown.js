export function exportMarkdown(payload = {}) {
  const profile = payload.profile || {};
  const draft = payload.draft || {};
  const contact = draft.contact || profile.contact || {};
  const lines = [];

  if (contact.name) lines.push(`# ${contact.name}`);
  const contactMeta = [contact.email, contact.phone, contact.location].filter(Boolean).join(' • ');
  if (contactMeta) lines.push(contactMeta);
  if (lines.length > 0) lines.push('');

  const summary = draft.summary || draft.headline || profile.headline || '';
  if (summary) {
    lines.push('## Summary');
    lines.push('');
    lines.push(String(summary));
    lines.push('');
  }

  const roles = Array.isArray(draft.roles) && draft.roles.length > 0
    ? draft.roles
    : Array.isArray(profile.roles)
      ? profile.roles.filter((r) => r && r.verificationStatus === 'verified')
      : [];

  if (roles.length > 0) {
    lines.push('## Experience');
    lines.push('');
    for (const role of roles) {
      const titleLine = [role.title, role.company].filter(Boolean).join(' — ');
      const periodLine = role.period || role.dates || '';
      if (titleLine) {
        lines.push(periodLine ? `### ${titleLine} (${periodLine})` : `### ${titleLine}`);
      }
      const bullets = Array.isArray(role.accomplishments)
        ? role.accomplishments.filter((a) => !a.verificationStatus || a.verificationStatus === 'verified')
        : [];
      for (const b of bullets) {
        const text = typeof b === 'string' ? b : b.text || b.statement || b.description || '';
        const prov = typeof b === 'object' && b.source ? ` \`[${b.verificationStatus || 'verified'} — ${b.source}]\`` : '';
        if (text) lines.push(`- ${text}${prov}`);
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
    lines.push('## Verified Skills');
    lines.push('');
    lines.push(
      verifiedSkills
        .map((s) => (typeof s === 'string' ? s : s.name || s.label || ''))
        .filter(Boolean)
        .map((name) => `\`${name}\``)
        .join(', ')
    );
    lines.push('');
  }

  return lines.join('\n').trim();
}

export default exportMarkdown;
