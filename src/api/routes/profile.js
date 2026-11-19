import { validateProfile } from '../../schemas/profile.js';

export async function handleProfile({ req, res, store, sendJson, readJsonBody }) {
  if (req.method === 'GET' || req.method === 'HEAD') {
    const profile = store.getProfile();
    const errors = validateProfile(profile);
    sendJson(res, 200, {
      profile,
      valid: errors.length === 0,
      errors
    });
    return true;
  }

  if (req.method === 'PUT' || req.method === 'POST') {
    const body = await readJsonBody(req);
    const candidate = body?.profile && typeof body.profile === 'object' ? body.profile : body;
    const errors = validateProfile(candidate);
    if (errors.length > 0) {
      sendJson(res, 400, {
        error: 'Invalid profile payload',
        errors
      });
      return true;
    }
    const updated = typeof store.setProfile === 'function' ? store.setProfile(candidate) : candidate;
    sendJson(res, 200, {
      profile: updated,
      valid: true,
      errors: []
    });
    return true;
  }

  sendJson(res, 405, { error: 'Method Not Allowed' });
  return true;
}

export default handleProfile;
