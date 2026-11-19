import { extractRequirements } from './requirements/extractor.js';
import { buildEvidenceIndex } from './requirements/evidence-index.js';
import { canonicalSkill } from './requirements/skill-catalog.js';
import { analyzeRequirements, matchRequirements } from './requirements/index.js';

export function mapRequirements(profileOrReqs, maybeReqsOrProfile) {
  let profile = profileOrReqs;
  let requirements = maybeReqsOrProfile;

  if (Array.isArray(profileOrReqs) && !Array.isArray(maybeReqsOrProfile)) {
    requirements = profileOrReqs;
    profile = maybeReqsOrProfile || {};
  }

  const reqList = Array.isArray(requirements) ? requirements : [];
  const index = buildEvidenceIndex(profile || {});

  return reqList.map((req) => {
    const rawText = typeof req === 'string' ? req : req?.text || req?.requirement || req?.label || req?.name || '';
    const key = canonicalSkill(rawText);
    const hits = index.get(key) || [];
    const verifiedHits = hits.filter((item) => !item?.verificationStatus || item.verificationStatus === 'verified');
    const matched = verifiedHits.length > 0;

    return {
      ...(typeof req === 'object' && req !== null ? req : { text: rawText }),
      requirement: rawText,
      text: rawText,
      matched,
      status: matched ? 'supported' : 'missing',
      evidence: verifiedHits,
      evidenceIds: verifiedHits.map((e) => e?.id).filter(Boolean)
    };
  });
}

export async function analyze(a, b) {
  let profile = a;
  let jobDescription = b;

  if (typeof a === 'string' && b && typeof b === 'object') {
    jobDescription = a;
    profile = b;
  } else if (typeof b === 'string' && a && typeof a === 'object') {
    profile = a;
    jobDescription = b;
  }

  const jdText =
    typeof jobDescription === 'string'
      ? jobDescription
      : jobDescription?.text || jobDescription?.description || '';

  const requirements = extractRequirements(jdText);
  const mapped = mapRequirements(profile || {}, requirements);
  const supportedCount = mapped.filter((m) => m.matched || m.status === 'supported').length;
  const coverage = requirements.length > 0 ? Math.round((supportedCount / requirements.length) * 100) : 100;

  return {
    requirements,
    mapped,
    mapping: mapped,
    matches: mapped,
    coverage,
    groundedOnly: true,
    verifiedEvidenceOnly: true
  };
}

export { extractRequirements, matchRequirements, analyzeRequirements };
export default { analyze, extractRequirements, mapRequirements, matchRequirements, analyzeRequirements };
