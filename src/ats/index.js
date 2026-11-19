import { checkContact } from './contact.js';
import { checkSections } from './sections.js';
import { checkBulletLength } from './bullet-length.js';
import { checkGroundingCoverage } from './grounding-coverage.js';
import { checkProvenanceLock } from './provenance-lock.js';
export function runAtsChecks(profile, draft, analysis = { requirements: [] }) { const checks = [checkContact(draft), checkSections(draft), checkBulletLength(draft), checkGroundingCoverage(draft, analysis), checkProvenanceLock(draft)]; return { checks, passed: checks.every(check => check.passed), verifiedRecordCount: [...(draft.roles || []).flatMap(role => role.accomplishments), ...(draft.skills || [])].length }; }
