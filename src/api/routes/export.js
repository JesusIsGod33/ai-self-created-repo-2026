import * as exportersMod from '../../exporters/index.js';
import * as builderMod from '../../domain/tailoring/builder.js';
import * as reqMod from '../../domain/requirements.js';
import { validateExportRequest } from '../../schemas/export-request.js';

const exportBundle =
  exportersMod.exportArtifact ||
  exportersMod.exportDraft ||
  exportersMod.renderExport ||
  exportersMod.default?.exportArtifact ||
  exportersMod.default;

const exportDoc =
  exportersMod.exportDocument ||
  exportersMod.default?.exportDocument ||
  null;

const buildDraft =
  builderMod.buildTailoredDraft ||
  builderMod.buildDraft ||
  builderMod.tailorResume ||
  builderMod.default?.buildTailoredDraft ||
  builderMod.default;

const runAnalyze =
  reqMod.analyze ||
  reqMod.analyzeRequirements ||
  reqMod.default?.analyze ||
  reqMod.default;

function normalizeFormat(rawFormat) {
  if (rawFormat && typeof rawFormat === 'object') {
    rawFormat = rawFormat.format || rawFormat.type || rawFormat.target || 'markdown';
  }
  const f = String(rawFormat || 'markdown').trim().toLowerCase();
  if (f === 'plain-text' || f === 'plain' || f === 'txt' || f === 'text') return 'text';
  if (f === 'md' || f === 'markdown') return 'markdown';
  if (f === 'json-bundle' || f === 'bundle' || f === 'json') return 'json';
  if (f === 'audit-report' || f === 'provenance-audit' || f === 'audit') return 'audit';
  return 'markdown';
}

async function parseBody(req, readJsonBody) {
  if (typeof readJsonBody === 'function') {
    try {
      const parsed = await readJsonBody(req);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch (_) {}
  }
  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf-8').trim();
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (_) {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

export async function handleExport({ req, res, store, sendJson, readJsonBody }) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method Not Allowed' });
    return true;
  }

  const body = await parseBody(req, readJsonBody);
  const errors = validateExportRequest(body);
  if (errors.length > 0) {
    sendJson(res, 400, { error: 'Invalid export request', errors });
    return true;
  }

  const format = normalizeFormat(body.format ?? body.type ?? body.target);
  const profile =
    body?.profile && typeof body.profile === 'object'
      ? body.profile
      : typeof store?.getProfile === 'function'
        ? store.getProfile()
        : {};
  const jdText =
    typeof body.jobDescription === 'string'
      ? body.jobDescription
      : body.jobDescription?.text || '';

  let draft = body.draft;
  let analysis = body.analysis;

  if (!draft && typeof buildDraft === 'function') {
    if (!analysis && jdText && typeof runAnalyze === 'function') {
      analysis = await runAnalyze(jdText, profile);
    }
    draft = await buildDraft({ profile, jobDescription: jdText, analysis });
  }

  const artifact =
    typeof exportBundle === 'function'
      ? await exportBundle({ format, draft, profile, analysis, jobDescription: jdText })
      : { format, content: JSON.stringify(draft || profile, null, 2) };

  const content =
    typeof exportDoc === 'function'
      ? exportDoc(format, profile, draft, analysis)
      : artifact?.content ?? JSON.stringify(artifact, null, 2);

  sendJson(res, 200, {
    ...(typeof artifact === 'object' && artifact !== null ? artifact : {}),
    format,
    content
  });
  return true;
}

export default handleExport;
