import { getProfile, replaceProfile } from '../domain/store.js';
import { analyze } from '../domain/requirements.js';
import { buildTailoredResume, toPlainText } from '../domain/tailoring.js';
import { validateProfile } from '../schemas/profile.js';

async function readJson(req) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 1_000_000) {
      throw Object.assign(new Error('Request body is too large.'), { status: 413 });
    }
  }
  try {
    return JSON.parse(raw || '{}');
  } catch {
    throw Object.assign(new Error('Request body must be valid JSON.'), { status: 400 });
  }
}

function respond(res, status, data, headers = {}) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'x-content-type-options': 'nosniff',
    ...headers
  });
  res.end(JSON.stringify(data));
}

export async function routeApi(req, res) {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (req.method === 'GET' && url.pathname === '/api/profile') {
      return respond(res, 200, getProfile());
    }
    if (req.method === 'PUT' && url.pathname === '/api/profile') {
      const body = await readJson(req);
      const errors = validateProfile(body);
      if (errors.length) {
        return respond(res, 422, { error: 'Profile validation failed.', details: errors });
      }
      replaceProfile(body);
      return respond(res, 200, getProfile());
    }
    if (req.method === 'POST' && ['/api/analyze', '/api/tailor', '/api/export'].includes(url.pathname)) {
      const { jobDescription = '', format = 'text' } = await readJson(req);
      if (typeof jobDescription !== 'string' || jobDescription.trim().length < 20) {
        return respond(res, 422, { error: 'Add a job description of at least 20 characters.' });
      }
      if (jobDescription.length > 30000) {
        return respond(res, 413, { error: 'Job description is limited to 30,000 characters.' });
      }
      if (url.pathname === '/api/analyze') {
        return respond(res, 200, analyze(getProfile(), jobDescription));
      }
      const draft = buildTailoredResume(getProfile(), jobDescription);
      if (url.pathname === '/api/export') {
        if (format !== 'text') {
          return respond(res, 422, { error: 'Supported export format: text.' });
        }
        return respond(res, 200, { filename: 'grounded-resume.txt', content: toPlainText(draft) });
      }
      return respond(res, 200, draft);
    }
    return respond(res, 404, { error: 'API route not found.' });
  } catch (error) {
    return respond(res, error.status || 500, {
      error: error.status ? error.message : 'Unexpected server error.'
    });
  }
}
