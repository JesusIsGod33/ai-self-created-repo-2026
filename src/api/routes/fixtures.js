import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURES_DIR = path.resolve(__dirname, '../../fixtures');

export async function handleFixtures({ req, res, store, sendJson }) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    sendJson(res, 405, { error: 'Method Not Allowed' });
    return true;
  }

  const profileRaw = await fs.readFile(path.join(FIXTURES_DIR, 'master-profile.json'), 'utf-8');
  const jobsRaw = await fs.readFile(path.join(FIXTURES_DIR, 'job-descriptions.json'), 'utf-8');

  sendJson(res, 200, {
    profile: typeof store?.getProfile === 'function' ? store.getProfile() : JSON.parse(profileRaw),
    masterProfile: JSON.parse(profileRaw),
    jobDescriptions: JSON.parse(jobsRaw)
  });
  return true;
}

export default handleFixtures;
