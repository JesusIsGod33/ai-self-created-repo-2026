export async function handleHealth({ req, res, store, sendJson }) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    sendJson(res, 405, { error: 'Method Not Allowed' });
    return true;
  }

  const profile = typeof store?.getProfile === 'function' ? store.getProfile() : null;
  const rolesCount = Array.isArray(profile?.roles) ? profile.roles.length : 0;

  sendJson(res, 200, {
    status: 'ok',
    service: 'grounded-career-studio',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    profileLoaded: Boolean(profile),
    rolesCount
  });
  return true;
}

export default handleHealth;
