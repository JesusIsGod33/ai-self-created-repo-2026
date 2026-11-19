import * as reqMod from '../../domain/requirements.js';
import * as builderMod from '../../domain/tailoring/builder.js';
import * as atsMod from '../../ats/index.js';
import { validateJobDescription } from '../../schemas/job-description.js';
import { validateProfile } from '../../schemas/profile.js';

const runAnalyze =
  reqMod.analyze ||
  reqMod.analyzeRequirements ||
  reqMod.default?.analyze ||
  reqMod.default;

const buildDraft =
  builderMod.buildTailoredDraft ||
  builderMod.buildDraft ||
  builderMod.tailorResume ||
  builderMod.default?.buildTailoredDraft ||
  builderMod.default;

const runAts =
  atsMod.runAtsChecks ||
  atsMod.evaluateAts ||
  atsMod.auditAts ||
  atsMod.checkAts ||
  atsMod.default?.runAtsChecks ||
  atsMod.default;

export async function handleTailor({ req, res, store, sendJson, readJsonBody }) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method Not Allowed' });
    return true;
  }

  const body = await readJsonBody(req);
  const jobDescription = body?.jobDescription ?? body?.jd ?? '';
  const jdErrors = validateJobDescription(
    typeof jobDescription === 'string' ? { text: jobDescription } : jobDescription
  );
  if (jdErrors.length > 0) {
    sendJson(res, 400, { error: 'Invalid job description', errors: jdErrors });
    return true;
  }

  const profile = body?.profile && typeof body.profile === 'object' ? body.profile : store.getProfile();
  const profileErrors = validateProfile(profile);
  if (profileErrors.length > 0) {
    sendJson(res, 400, { error: 'Invalid profile', errors: profileErrors });
    return true;
  }

  const jdText = typeof jobDescription === 'string' ? jobDescription : jobDescription.text || '';
  const analysis = typeof runAnalyze === 'function' ? await runAnalyze(jdText, profile) : null;
  const draft =
    typeof buildDraft === 'function'
      ? await buildDraft(profile, analysis, jdText)
      : { profile, analysis };
  const ats =
    typeof runAts === 'function'
      ? await runAts(profile, draft, analysis)
      : { passed: true, checks: [] };

  sendJson(res, 200, {
    analysis,
    draft,
    ats
  });
  return true;
}

export default handleTailor;
