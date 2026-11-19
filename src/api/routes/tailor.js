import { getProfile } from '../../domain/store.js';
import { buildTailoredDraft } from '../../domain/tailoring/builder.js';
import { analyzeRequirements } from '../../domain/requirements/index.js';
import { runAtsChecks } from '../../ats/index.js';
export const tailorRoutes = [['POST /api/tailor', async ({ req }) => { const { readJson } = await import('../router.js'); const body = await readJson(req); const profile = getProfile(); const analysis = analyzeRequirements(profile, String(body.description || '')); const draft = buildTailoredDraft(profile, analysis); return { analysis, draft, ats: runAtsChecks(profile, draft) }; }]];
