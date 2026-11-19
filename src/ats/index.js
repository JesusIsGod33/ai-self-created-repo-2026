import { checkContact } from './contact.js';
import { checkSections } from './sections.js';
import { checkBulletLength } from './bullet-length.js';
import { checkGroundingCoverage } from './grounding-coverage.js';
import { checkProvenanceLock } from './provenance-lock.js';

export function runAtsChecks(profile, draft, analysis = { requirements: [] }) {
  const safeDraft = draft && typeof draft === 'object' ? draft : {};
  const safeAnalysis = analysis && typeof analysis === 'object' ? analysis : { requirements: [] };
  const checks = [
    checkContact(safeDraft),
    checkSections(safeDraft),
    checkBulletLength(safeDraft),
    checkGroundingCoverage(safeDraft, safeAnalysis),
    checkProvenanceLock(safeDraft)
  ];
  return {
    checks,
    passed: checks.every((item) => item.passed),
    verifiedRecordCount: [
      ...(safeDraft.roles || []),
      ...(safeDraft.roles || []).flatMap((role) => role.accomplishments || []),
      ...(safeDraft.skills || []),
      ...(safeDraft.tools || []),
      ...(safeDraft.education || []),
      ...(safeDraft.certifications || []),
      ...(safeDraft.projects || []),
      ...(safeDraft.metrics || []),
      ...(safeDraft.summaryRecord ? [safeDraft.summaryRecord] : [])
    ].length
  };
}

export default runAtsChecks;
