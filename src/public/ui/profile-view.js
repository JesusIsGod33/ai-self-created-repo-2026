function esc(val) {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function renderProfile(payload) {
  const profile = payload?.profile && typeof payload.profile === 'object' ? payload.profile : payload || {};
  const name = profile?.contact?.name || profile?.name || 'Verified Candidate';
  const headline = profile?.headline || 'Provenance-locked profile';
  const skills = Array.isArray(profile?.skills)
    ? profile.skills.filter((s) => s?.verificationStatus === 'verified')
    : [];
  const roles = Array.isArray(profile?.roles)
    ? profile.roles.filter((r) => r?.verificationStatus === 'verified')
    : [];

  return `
    <div>
      <strong>${esc(name)}</strong>
      <p class="subtitle">${esc(headline)}</p>
      <p><strong>Verified Skills (${skills.length}):</strong> ${
        skills.length ? esc(skills.map((s) => s.name || s.label || s.text).filter(Boolean).join(', ')) : 'None'
      }</p>
      <p><strong>Verified Roles (${roles.length}):</strong></p>
      <ul class="item-list">
        ${
          roles.length
            ? roles
                .map(
                  (r) =>
                    `<li><strong>${esc(r.title || 'Role')}</strong>${r.company ? ` — ${esc(r.company)}` : ''}</li>`
                )
                .join('')
            : '<li>No verified roles listed.</li>'
        }
      </ul>
    </div>
  `;
}

export default renderProfile;
