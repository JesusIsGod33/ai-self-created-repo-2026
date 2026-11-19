function isVerified(item) {
  return Boolean(item && typeof item === 'object' && item.verificationStatus === 'verified');
}

function safeArray(val) {
  return Array.isArray(val) ? val : [];
}

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/g)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
}

export function buildSkillGraph(profile = {}, jobDescription = '') {
  const skills = safeArray(profile.skills).filter(isVerified);
  const tools = safeArray(profile.tools).filter(isVerified);
  const certs = safeArray(profile.certifications).filter(isVerified);
  const roles = safeArray(profile.roles).filter(isVerified);

  const verifiedTokens = new Set();
  for (const s of skills) tokenize(s.name || s.label || s.text).forEach((t) => verifiedTokens.add(t));
  for (const t of tools) tokenize(t.name || t.label || t.text).forEach((tok) => verifiedTokens.add(tok));
  for (const c of certs) tokenize(c.name || c.title).forEach((tok) => verifiedTokens.add(tok));
  for (const r of roles) {
    tokenize(r.title).forEach((tok) => verifiedTokens.add(tok));
    for (const acc of safeArray(r.accomplishments).filter(isVerified)) {
      tokenize(acc.text || acc.statement).forEach((tok) => verifiedTokens.add(tok));
    }
  }

  const jdTokens = [...new Set(tokenize(jobDescription))].filter(
    (w) =>
      ![
        'with', 'from', 'that', 'this', 'have', 'will', 'your', 'role', 'team',
        'work', 'years', 'experience', 'strong', 'ability', 'using', 'required',
        'preferred', 'including', 'across', 'and', 'the', 'for', 'are', 'you'
      ].includes(w)
  );

  const matchedKeywords = jdTokens.filter((tok) => verifiedTokens.has(tok));
  const gapKeywords = jdTokens.filter((tok) => !verifiedTokens.has(tok)).slice(0, 12);

  return {
    hardSkills: skills.map((s) => s.name || s.label || s.text).filter(Boolean),
    tools: tools.map((t) => t.name || t.label || t.text).filter(Boolean),
    certifications: certs.map((c) => c.name || c.title).filter(Boolean),
    verifiedRoleCount: roles.length,
    matchedKeywords,
    gapKeywords,
    readinessScore: jdTokens.length
      ? Math.round((matchedKeywords.length / jdTokens.length) * 100)
      : 100
  };
}

export function generateCoverLetter({ profile = {}, jobDescription = '', tone = 'executive', company = 'Target Team' }) {
  const contact = profile.contact || {};
  const candidateName = contact.name || profile.name || 'Candidate';
  const roles = safeArray(profile.roles).filter(isVerified);
  const skills = safeArray(profile.skills)
    .filter(isVerified)
    .map((s) => s.name || s.label || s.text)
    .filter(Boolean);

  const topRole = roles[0];
  const topBullet = safeArray(topRole?.accomplishments)
    .filter(isVerified)
    .map((b) => b.text || b.statement)
    .find(Boolean);

  const jdTerms = [...new Set(tokenize(jobDescription))].slice(0, 6);
  const focusLine = jdTerms.length ? jdTerms.join(', ') : 'cross-functional execution and measurable delivery';

  const greeting =
    tone === 'conversational'
      ? `Hi ${company} Hiring Team,`
      : `Dear ${company} Hiring Committee,`;

  const opening =
    tone === 'conversational'
      ? `I'm excited to share how my verified background in ${skills.slice(0, 3).join(', ') || 'operations and delivery'} aligns with what ${company} is building around ${focusLine}.`
      : `I am writing to express strong interest in contributing to ${company}, bringing provenance-verified experience across ${skills.slice(0, 3).join(', ') || 'core domain operations'} and alignment with ${focusLine}.`;

  const proofParagraph = topRole
    ? `Most recently as ${topRole.title}${topRole.company ? ` at ${topRole.company}` : ''}, I focused on verifiable outcomes${topBullet ? `—including: "${topBullet}"` : '.'}`
    : `Every highlight in my application is tied directly to verified records rather than unsubstantiated claims.`;

  const closing =
    tone === 'conversational'
      ? `Would love to walk through how I can help ${company} hit its goals. Best,\n${candidateName}`
      : `Thank you for your time and consideration. I welcome the opportunity to discuss how my verified experience supports ${company}.\n\nSincerely,\n${candidateName}`;

  return {
    tone,
    company,
    letter: `${greeting}\n\n${opening}\n\n${proofParagraph}\n\n${closing}`
  };
}

export function buildInterviewAndCompPlan({ profile = {}, jobDescription = '', roleTitle = 'Target Role', location = 'Remote / US', targetComp = 95000 }) {
  const roles = safeArray(profile.roles).filter(isVerified);
  const bullets = roles.flatMap((r) =>
    safeArray(r.accomplishments)
      .filter(isVerified)
      .map((b) => ({
        role: r.title || 'Verified Role',
        prompt: `Walk through "${b.text || b.statement}" using STAR (Situation, Task, Action, Result) without adding unverified metrics.`,
        evidenceId: b.id || b.evidenceId || 'verified-record'
      }))
  );

  const baseComp = Number(targetComp) || 95000;
  const anchorHigh = Math.round(baseComp * 1.12);
  const walkAwayFloor = Math.round(baseComp * 0.94);

  return {
    roleTitle,
    location,
    starPrompts: bullets.slice(0, 5),
    compensation: {
      baselineTarget: baseComp,
      counterOfferAnchor: anchorHigh,
      floorThreshold: walkAwayFloor,
      negotiationScript: `Based on the scope of ${roleTitle} in ${location} and the verified operational impact I bring, I am targeting $${anchorHigh.toLocaleString()} in base compensation, with flexibility around total rewards and performance milestones.`
    },
    jdSignals: [...new Set(tokenize(jobDescription))].slice(0, 10)
  };
}
