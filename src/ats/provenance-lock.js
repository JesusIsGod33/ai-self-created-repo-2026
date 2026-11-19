export function checkProvenanceLock(draft) {
  if (!draft || typeof draft !== 'object') {
    return {
      name: 'provenance-lock',
      passed: false,
      issues: ['Missing draft object']
    };
  }
  const records = [
    ...(draft.roles || []),
    ...(draft.roles || []).flatMap((role) => role.accomplishments || []),
    ...(draft.skills || []),
    ...(draft.tools || []),
    ...(draft.education || []),
    ...(draft.certifications || []),
    ...(draft.projects || []),
    ...(draft.metrics || []),
    ...(draft.summaryRecord ? [draft.summaryRecord] : [])
  ];
  const invalid = records.filter(
    (record) => !record || !record.id || !record.source || record.verificationStatus !== 'verified'
  );
  return {
    name: 'provenance-lock',
    passed: invalid.length === 0 && draft.groundedOnly === true,
    issues: invalid.map((item) => `Record ${item?.id || '(unknown)'} lacks verified provenance`)
  };
}
