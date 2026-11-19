export function validateProfile(profile) {
  if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
    return ['Profile must be a valid object'];
  }
  return [];
}

export default validateProfile;
