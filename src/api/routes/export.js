import { getProfile } from '../../domain/store.js';
import { buildTailoredDraft } from '../../domain/tailoring/builder.js';
import { analyzeRequirements } from '../../domain/requirements/index.js';
import { exportDocument } from '../../exporters/index.js';
import { validateExportRequest } from '../../schemas/export-request.js';
import { readJson } from '../router.js';
export const exportRoutes = [['POST /api/export', async ({ req, res }) => { const request = await readJson(req); const errors = validateExportRequest(request); if (errors.length) { const error = new Error('Invalid export request'); error.name = 'ValidationError'; error.details = errors; throw error; } const profile = getProfile(); const draft = buildTailoredDraft(profile, analyzeRequirements(profile, request.description || '')); const content = exportDocument(request.format, profile, draft); res.writeHead(200, { 'content-type': `${request.format === 'json' ? 'application/json' : 'text/plain'}; charset=utf-8`, 'content-disposition': `attachment; filename="grounded-career.${request.format === 'markdown' ? 'md' : request.format === 'json' ? 'json' : 'txt'}"`, 'x-content-type-options': 'nosniff' }); res.end(content); }]];
