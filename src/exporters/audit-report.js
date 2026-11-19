export function exportAuditReport(payload = {}) {
  const profile = payload.profile || {};
  const verifiedRecords = [];
  const excludedRecords = [];

  const scanList = (items = [], section) => {
    for (const item of Array.isArray(items) ? items : []) {
      if (!item || typeof item !== 'object') continue;
      const status = item.verificationStatus || 'verified';
      const entry = {
        id: item.id || null,
        section,
        source: item.source || null,
        verificationStatus: status
      };
      if (status === 'verified') {
        verifiedRecords.push(entry);
      } else {
        excludedRecords.push(entry);
      }
    }
  };

  scanList(profile.roles, 'roles');
  scanList(profile.skills, 'skills');
  scanList(profile.tools, 'tools');
  scanList(profile.certifications, 'certifications');
  scanList(profile.education, 'education');
  scanList(profile.projects, 'projects');
  scanList(profile.summaryVariants, 'summaryVariants');

  for (const role of Array.isArray(profile.roles) ? profile.roles : []) {
    scanList(role.accomplishments, `role:${role.id || role.title || 'unknown'}:accomplishments`);
    for (const acc of Array.isArray(role.accomplishments) ? role.accomplishments : []) {
      scanList(acc.metrics, `accomplishment:${acc.id || 'unknown'}:metrics`);
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    provenanceLock: 'strict-verified-only',
    summary: {
      verifiedCount: verifiedRecords.length,
      excludedCount: excludedRecords.length,
      hasDraft: Boolean(payload.draft),
      hasAnalysis: Boolean(payload.analysis)
    },
    verifiedRecords,
    excludedRecords
  };
}

export default exportAuditReport;
