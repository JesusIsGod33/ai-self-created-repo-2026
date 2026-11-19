const STOP = new Set(
  'a an and are as at be by for from in into is it of on or the to with this that years year experience ability strong preferred required plus using including'.split(' ')
);

const SKILLS = [
  'javascript',
  'typescript',
  'python',
  'java',
  'sql',
  'react',
  'node.js',
  'node',
  'aws',
  'azure',
  'gcp',
  'docker',
  'kubernetes',
  'excel',
  'tableau',
  'leadership',
  'project management',
  'data analysis',
  'communication',
  'agile',
  'machine learning',
  'salesforce',
  'git',
  'accessibility',
  'security',
  'analytics'
];

const NORMAL = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function extractRequirements(description) {
  const text = String(description || '').replace(/\r/g, ' ');
  const lines = text
    .split(/\n|[•▪●]/)
    .map((s) => s.replace(/^\s*[-*\d.)]+\s*/, '').trim())
    .filter(Boolean);
  const candidates = [];

  for (const line of lines) {
    const norm = NORMAL(line);
    if (norm.length < 3 || norm.length > 240) continue;
    const hits = SKILLS.filter((skill) =>
      new RegExp(`(^|[^a-z0-9])${escapeRegExp(skill)}([^a-z0-9]|$)`, 'i').test(norm)
    );
    const phrases = hits.length
      ? hits
      : norm
          .split(/[,;:]/)
          .flatMap((chunk) => (chunk.trim().split(/\s+/).length <= 5 ? [chunk.trim()] : []));
    for (const phrase of phrases) {
      const value = phrase.trim();
      if (value.length >= 2 && !STOP.has(value) && !candidates.some((x) => NORMAL(x) === NORMAL(value))) {
        candidates.push(value);
      }
    }
  }

  if (!candidates.length) {
    for (const skill of SKILLS) {
      if (NORMAL(text).includes(NORMAL(skill))) {
        candidates.push(skill);
      }
    }
  }

  return candidates.slice(0, 40);
}

function verifiedEvidence(profile) {
  const facts = [];
  for (const role of profile?.roles || []) {
    for (const item of role.accomplishments || []) {
      if (item.verificationStatus === 'verified') {
        facts.push({
          text: item.text,
          id: item.id,
          source: item.source,
          role: role.title,
          company: role.company,
          skills: [...(item.skills || []), ...(role.skills || [])]
        });
      }
    }
  }
  for (const item of profile?.skills || []) {
    if (item.verificationStatus === 'verified') {
      facts.push({
        text: item.name,
        id: item.id,
        source: item.source,
        skills: [item.name]
      });
    }
  }
  for (const item of profile?.projects || []) {
    if (item.verificationStatus === 'verified') {
      facts.push({
        text: item.description,
        id: item.id,
        source: item.source,
        skills: item.skills || []
      });
    }
  }
  return facts;
}

export function mapRequirements(profile, requirements) {
  const facts = verifiedEvidence(profile);
  return (requirements || []).map((requirement) => {
    const term = NORMAL(requirement);
    const matches = facts.filter(
      (fact) =>
        NORMAL([fact.text, ...(fact.skills || [])].join(' ')).includes(term) ||
        term
          .split(/\s+/)
          .filter((w) => w.length > 2)
          .some((word) => NORMAL([fact.text, ...(fact.skills || [])].join(' ')).includes(word))
    );
    const status = matches.length
      ? matches.some((m) => NORMAL(m.text).includes(term))
        ? 'supported'
        : 'partial'
      : 'gap';
    return {
      requirement,
      status,
      evidence: matches.slice(0, 4).map(({ id, text, source, role, company }) => ({
        id,
        text,
        source,
        role,
        company
      }))
    };
  });
}
