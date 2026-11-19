function esc(val) {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function renderAts(ats) {
  if (!ats || typeof ats !== 'object') {
    return '<p>No ATS checks run.</p>';
  }
  const score = typeof ats.score === 'number' ? `${ats.score}/100` : 'N/A';
  const checks = Array.isArray(ats.checks) ? ats.checks : [];

  return `
    <div>
      <p><strong>ATS &amp; Provenance Score:</strong> ${esc(score)}</p>
      <ul class="item-list">
        ${checks
          .map((chk) => {
            const st = String(chk?.status || 'warn').toLowerCase();
            const cls = st === 'pass' ? 'tag-pass' : st === 'fail' ? 'tag-fail' : 'tag-warn';
            return `<li><span class="${cls}">[${esc(st.toUpperCase())}]</span> <strong>${esc(chk?.label || chk?.id || 'Check')}</strong>: ${esc(chk?.detail || '')}</li>`;
          })
          .join('')}
      </ul>
    </div>
  `;
}

export default renderAts;
