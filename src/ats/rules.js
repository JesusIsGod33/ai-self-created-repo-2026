import { toPlainText } from '../domain/tailoring.js';

export function runAtsChecks(firstArg, secondArg, thirdArg) {
  let profile = {};
  let draft = {};
  let analysis = null;

  if (
    firstArg &&
    typeof firstArg === 'object' &&
    !Array.isArray(firstArg) &&
    (firstArg.draft || firstArg.profile) &&
    !Array.isArray(firstArg.roles) &&
    !firstArg.summary
  ) {
    draft = firstArg.draft || {};
    profile = firstArg.profile || {};
    analysis = firstArg.analysis || null;
  } else if (
    firstArg &&
    typeof firstArg === 'object' &&
    (Array.isArray(firstArg.roles) || Array.isArray(firstArg.skills)) &&
    secondArg &&
    typeof secondArg === 'object' &&
    (secondArg.summary || secondArg.headline || secondArg.provenancePolicy)
  ) {
    profile = firstArg;
    draft = secondArg;
    analysis = thirdArg && typeof thirdArg === 'object' ? thirdArg : null;
  } else {
    draft = firstArg && typeof firstArg === 'object' ? firstArg : {};
    profile = secondArg && typeof secondArg === 'object' ? secondArg : {};
    analysis = thirdArg && typeof thirdArg === 'object' ? thirdArg : null;
  }

  const plain = toPlainText(draft);
  const checks = [];

  const hasContact = Boolean(draft?.contact?.email || draft?.contact?.phone || profile?.contact?.email || profile?.contact?.phone);
  checks.push({
    id: 'contact-info',
    name: 'contact-info',
    label: 'Contact details present',
    status: hasContact ? 'pass' : 'warn',
    passed: hasContact,
    detail: hasContact
      ? 'Email or phone number is included in the header.'
      : 'Add an email address or phone number before submitting.'
  });

  const hasSummaryAndExperience =
    Boolean(String(draft?.summary || '').trim()) && (draft?.roles || []).length > 0;
  checks.push({
    id: 'standard-sections',
    name: 'standard-sections',
    label: 'Standard summary and experience sections',
    status: hasSummaryAndExperience ? 'pass' : 'fail',
    passed: hasSummaryAndExperience,
    detail: hasSummaryAndExperience
      ? 'Includes summary and role history sections.'
      : 'Summary or experience entries are missing.'
  });

  const longBullets = (draft?.roles || []).flatMap((role) =>
    (role.accomplishments || []).filter((item) => String(item.text || '').split(/\s+/).length > 32)
  );
  checks.push({
    id: 'bullet-length',
    name: 'bullet-length',
    label: 'Concise accomplishment bullets',
    status: longBullets.length === 0 ? 'pass' : 'warn',
    passed: longBullets.length === 0,
    detail:
      longBullets.length === 0
        ? 'All accomplishment bullets stay within 32 words.'
        : `${longBullets.length} bullet(s) exceed 32 words and may be harder to scan.`
  });

  const mapped = Array.isArray(draft?.mapping) && draft.mapping.length > 0
    ? draft.mapping
    : Array.isArray(analysis?.mapped)
      ? analysis.mapped
      : Array.isArray(analysis?.requirements)
        ? analysis.requirements
        : [];
  const supportedCount = mapped.filter((m) => m.status === 'supported' || m.matched === true).length;
  const coverage = mapped.length ? Math.round((supportedCount / mapped.length) * 100) : 100;
  checks.push({
    id: 'grounded-coverage',
    name: 'grounded-coverage',
    label: 'Verified requirement alignment',
    status: coverage >= 50 ? 'pass' : 'warn',
    passed: coverage >= 50,
    detail: `${supportedCount} of ${mapped.length} extracted requirement(s) (${coverage}%) match verified profile evidence.`
  });

  const verifiedFactIds = new Set(
    [
      ...(profile?.roles || []).flatMap((r) => r.accomplishments || []),
      ...(profile?.skills || []),
      ...(profile?.tools || []),
      ...(profile?.projects || [])
    ]
      .filter((item) => item && item.verificationStatus === 'verified' && item.id)
      .map((item) => item.id)
  );

  const ungroundedBullets = (draft?.roles || []).flatMap((role) =>
    (role.accomplishments || []).filter((bullet) => {
      if (!bullet || bullet.verificationStatus !== 'verified') return true;
      const evId = bullet.evidenceId || bullet.id;
      if (!evId) return true;
      if (verifiedFactIds.size > 0 && !verifiedFactIds.has(evId)) return true;
      return false;
    })
  );

  const unverifiedDraftItems = [
    ...(draft?.skills || []),
    ...(draft?.tools || []),
    ...(draft?.roles || []),
    ...(draft?.certifications || []),
    ...(draft?.education || []),
    ...(draft?.projects || [])
  ].filter((item) => item && item.verificationStatus && item.verificationStatus !== 'verified');

  const provenancePassed = ungroundedBullets.length === 0 && unverifiedDraftItems.length === 0;
  checks.push({
    id: 'provenance-lock',
    name: 'provenance-lock',
    label: 'Strict evidence provenance',
    status: provenancePassed ? 'pass' : 'fail',
    passed: provenancePassed,
    detail: provenancePassed
      ? 'Every included accomplishment and section links to a verified profile record.'
      : `${ungroundedBullets.length + unverifiedDraftItems.length} record(s) lack verified provenance.`
  });

  const passedCount = checks.filter((c) => c.passed).length;
  const score = Math.round((passedCount / checks.length) * 100);

  return {
    score,
    passed: provenancePassed,
    passedCount,
    total: checks.length,
    checks,
    characterCount: plain.length
  };
}

export default runAtsChecks;
