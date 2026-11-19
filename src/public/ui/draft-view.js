function esc(val) {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function renderDraft(draft) {
  if (!draft || typeof draft !== 'object') {
    return '<p>No draft available.</p>';
  }
  const summary = draft.summary || draft.headline || '';
  const roles = Array.isArray(draft.roles) ? draft.roles : [];

  return `
    <div>
      <p><strong>Summary:</strong> ${esc(summary)}</p>
      ${roles
        .map((role) => {
          const bullets = Array.isArray(role.accomplishments) ? role.accomplishments : [];
          return `
            <div style="margin-top:0.75rem;">
              <strong>${esc(role.title || 'Role')}</strong>${role.company ? ` — ${esc(role.company)}` : ''}
              <ul class="item-list">
                ${bullets
                  .map((b) => `<li>${esc(typeof b === 'string' ? b : b?.text || b?.statement || '')}</li>`)
                  .join('')}
              </ul>
            </div>
          `;
        })
        .join('')}
    </div>
  `;
}

export default renderDraft;
