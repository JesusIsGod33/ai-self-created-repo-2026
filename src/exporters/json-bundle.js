export function exportJsonBundle(payload = {}) {
  const profile = payload.profile || {};
  const verifiedRoles = (Array.isArray(profile.roles) ? profile.roles : [])
    .filter((r) => !r.verificationStatus || r.verificationStatus === 'verified')
    .map((role) => ({
      ...role,
      accomplishments: (Array.isArray(role.accomplishments) ? role.accomplishments : []).filter(
        (a) => !a.verificationStatus || a.verificationStatus === 'verified'
      )
    }));

  const filterVerified = (arr) =>
    (Array.isArray(arr) ? arr : []).filter((item) => !item.verificationStatus || item.verificationStatus === 'verified');

  return {
    schemaVersion: '1.1.0',
    provenancePolicy: 'verified-only',
    exportedAt: new Date().toISOString(),
    jobDescription: payload.jobDescription || '',
    analysis: payload.analysis || null,
    draft: payload.draft || null,
    groundedProfile: {
      contact: profile.contact || null,
      headline: profile.headline || '',
      roles: verifiedRoles,
      skills: filterVerified(profile.skills),
      tools: filterVerified(profile.tools),
      certifications: filterVerified(profile.certifications),
      education: filterVerified(profile.education),
      projects: filterVerified(profile.projects),
      summaryVariants: filterVerified(profile.summaryVariants)
    }
  };
}

export default exportJsonBundle;
