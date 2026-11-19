import { toPlainText } from '../domain/tailoring.js';

export function runAtsChecks(draft, profile) {
  const plain = toPlainText(draft);
  const checks = [];

  const hasContact = Boolean(draft?.contact?.email || draft?.contact?.phone);
  checks.push({
    id: 'contact-info',
    label: 'Contact details present',
    status: hasContact ? 'pass' : 'warn',
    detail: hasContact
      ? 'Email or phone number is included in the header.'
      : 'Add an email address or phone number before submitting.'
  });

  const hasSummaryAndExperience =
    Boolean(String(draft?.summary || '').trim()) && (draft?.roles || []).length > 0;
  checks.push({
    id: 'standard-sections',
    label: 'Standard summary and experience sections',
    status: hasSummaryAndExperience ? 'pass' : 'fail',
    detail: hasSummaryAndExperience
      ? 'Includes summary and role history sections.'
      : 'Summary or experience entries are missing.'
  });

  const longBullets = (draft?.roles || []).flatMap((role) =>
    (role.accomplishments || []).filter((item) => String(item.text || '').split(/\s+/).length > 32)
  );
  checks.push({
    id: 'bullet-length',
    label: 'Concise accomplishment bullets',
    status: longBullets.length === 0 ? 'pass' : 'warn',
    detail:
      longBullets.length === 0
        ? 'All accomplishment bullets stay within 32 words.'
        : `${longBullets.length} bullet(s) exceed 32 words and may be harder to scan.`
  });

  const mapped = draft?.mapping || [];
  const supportedCount = mapped.filter((m) => m.status === 'supported').length;
  const coverage = mapped.length ? Math.round((supportedCount / mapped.length) * 100) : 100;
  checks.push({
    id: 'grounded-coverage',
    label: 'Verified requirement alignment',
    status: coverage >= 50 ? 'pass' : 'warn',
    detail: `${supportedCount} of ${mapped.length} extracted requirement(s) (${coverage}%) match verified profile evidence.`
  });

  const verifiedFacts = [
    ...(profile?.roles || []).flatMap((r) => r.accomplishments || []),
    ...(profile?.skills || []),
    ...(profile?.projects || [])
  ].filter((item) => item.verificationStatus === 'verified');
  const ungrounded = (draft?.roles || []).flatMap((role) =>
    (role.accomplishments || []).filter(
      (bullet) => !verifiedFacts.some((fact) => fact.id === bullet.evidenceId)
    )
  );
  checks.push({
    id: 'provenance-lock',
    label: 'Strict evidence provenance',
    status: ungrounded.length === 0 ? 'pass' : 'fail',
    detail:
      ungrounded.length === 0
        ? 'Every included accomplishment links to a verified profile record.'
        : `${ungrounded.length} bullet(s) lack a verified evidence record.`
  });

  const passed = checks.filter((c) => c.status === 'pass').length;
  const score = Math.round((passed / checks.length) * 100);

  return {
    score,
    passed,
    total: checks.length,
    checks,
    characterCount: plain.length
  };
}
