import * as reqMod from '../../domain/requirements.js';
import * as analysisMod from '../../domain/analysis.js';
import { validateJobDescription } from '../../schemas/job-description.js';
import { validateProfile } from '../../schemas/profile.js';

const runAnalyze =
  reqMod.analyze ||
  reqMod.analyzeRequirements ||
  analysisMod.analyze ||
  reqMod.default?.analyze ||
  reqMod.default;

function extractJdText(body = {}) {
  const raw = body.jobDescription ?? body.jd ?? body.description ?? body.text ?? '';
  if (typeof raw === 'string') return raw;
  if (raw && typeof raw === 'object') {
    return String(raw.text ?? raw.description ?? raw.content ?? raw.body ?? '');
  }
  return '';
}

export async function handleAnalyze({ req, res, store, sendJson, readJsonBody }) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method Not Allowed' });
    return true;
  }

  const body = await readJsonBody(req);
  const jdText = extractJdText(body);
  const jdErrors = validateJobDescription(jdText);
  if (jdErrors.length > 0) {
    sendJson(res, 400, { error: 'Invalid job description', errors: jdErrors });
    return true;
  }

  const profile =
    body?.profile && typeof body.profile === 'object'
      ? body.profile
      : typeof store?.getProfile === 'function'
        ? store.getProfile()
        : {};
  const profileErrors = validateProfile(profile);
  if (profileErrors.length > 0) {
    sendJson(res, 400, { error: 'Invalid profile', errors: profileErrors });
    return true;
  }

  let result;
  try {
    result = await runAnalyze(jdText, profile);
    if (!result || (typeof result === 'object' && !result.requirements && !result.mapped && !result.matches)) {
      result = await runAnalyze(profile, jdText);
    }
  } catch {
    result = await runAnalyze(profile, jdText);
  }

  sendJson(res, 200, result && typeof result === 'object' ? result : { analysis: result });
  return true;
}

export default handleAnalyze;
