function esc(val) {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function renderAnalysis(analysis) {
  if (!analysis || typeof analysis !== 'object') {
    return '<p>No alignment data available.</p>';
  }
  const items = Array.isArray(analysis.mapped)
    ? analysis.mapped
    : Array.isArray(analysis.mapping)
      ? analysis.mapping
      : Array.isArray(analysis.requirements)
        ? analysis.requirements
        : [];
  const coverage = typeof analysis.coverage === 'number' ? `${analysis.coverage}%` : 'N/A';

  if (!items.length) {
    return `<p>Coverage: <strong>${esc(coverage)}</strong>. No specific requirements extracted.</p>`;
  }

  return `
    <div>
      <p><strong>Verified Evidence Coverage:</strong> ${esc(coverage)}</p>
      <ul class="item-list">
        ${items
          .map((item) => {
            const label =
              typeof item === 'string'
                ? item
                : item?.requirement || item?.text || item?.label || 'Requirement';
            const matched = Boolean(item?.matched || item?.status === 'supported');
            const statusClass = matched ? 'tag-pass' : 'tag-warn';
            const statusLabel = matched ? 'VERIFIED MATCH' : 'UNVERIFIED / GAP';
            return `<li><span class="${statusClass}">[${statusLabel}]</span> ${esc(label)}</li>`;
          })
          .join('')}
      </ul>
    </div>
  `;
}

export default renderAnalysis;
