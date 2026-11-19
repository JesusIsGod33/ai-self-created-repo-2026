import sampleProfile from '../fixtures/master-profile.json' with { type: 'json' };
import { validateProfile } from '../schemas/profile.js';

let profile = structuredClone(sampleProfile);

export function getProfile() {
  return structuredClone(profile);
}

export function replaceProfile(next) {
  const errors = validateProfile(next);
  if (errors.length) {
    throw new Error(errors.join(' '));
  }
  profile = structuredClone(next);
  return getProfile();
}
