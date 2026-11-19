import { getProfile } from '../../domain/store.js';
import { analyzeRequirements } from '../../domain/requirements/index.js';
export const analyzeRoutes = [['POST /api/analyze', async ({ req }) => { const body = await (await import('../router.js')).readJson(req); const description = String(body.description || ''); return analyzeRequirements(getProfile(), description); }]];
