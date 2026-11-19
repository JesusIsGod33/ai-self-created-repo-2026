const list = (v) => (Array.isArray(v) ? v : []);

function validateFact(item, path, errors) {
  if (!item || typeof item !== 'object') {
    errors.push(`${path} must be an object.`);
    return;
  }
  if (!item.id) errors.push(`${path} requires an id.`);
  if (!item.source || typeof item.source !== 'string') {
    errors.push(`${path} requires a source reference.`);
  }
  if (!['verified', 'unverified', 'needs_review'].includes(item.verificationStatus)) {
    errors.push(`${path} has an invalid verificationStatus.`);
  }
}

export function validateProfile(profile) {
  const errors = [];
  if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
    return ['Profile must be an object.'];
  }
  if (typeof profile.name !== 'string' || !profile.name.trim()) {
    errors.push('Name is required.');
  }
  for (const key of ['roles', 'skills', 'tools', 'certifications', 'education', 'projects', 'summaryVariants']) {
    if (!Array.isArray(profile[key])) errors.push(`${key} must be an array.`);
  }
  for (const [i, role] of list(profile.roles).entries()) {
    if (!role.title || !role.company) errors.push(`roles[${i}] requires title and company.`);
    if (!Array.isArray(role.accomplishments)) errors.push(`roles[${i}].accomplishments must be an array.`);
    for (const [j, item] of list(role.accomplishments).entries()) {
      validateFact(item, `roles[${i}].accomplishments[${j}]`, errors);
    }
  }
  for (const key of ['skills', 'tools', 'certifications', 'education', 'projects', 'summaryVariants']) {
    for (const [i, item] of list(profile[key]).entries()) {
      validateFact(item, `${key}[${i}]`, errors);
    }
  }
  return errors;
}
