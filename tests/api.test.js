import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createAppServer } from '../src/server.js';

const SAMPLE_JOB_DESCRIPTION = `
Senior Operations & Analytics Lead
We are seeking a Senior Operations Analyst to automate recurring SQL reporting pipelines,
build executive Tableau dashboards across cross-functional teams, streamline workflow operations,
and govern KPI data quality with strong stakeholder communication.
Requirements:
- 3+ years of experience in operations analytics or business operations
- Hands-on SQL reporting automation and BI dashboard development (Tableau)
- Cross-functional workflow optimization and documented process improvements
- Executive metric tracking and SLA monitoring
`;

function requestLocal(server, method, requestPath, body) {
  return new Promise((resolve, reject) => {
    const payload =
      body === undefined
        ? null
        : typeof body === 'string'
          ? body
          : JSON.stringify(body);

    const headers = {};
    if (payload !== null) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(
      {
        socketPath: server._pipePath,
        path: requestPath,
        method,
        headers
      },
      (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const rawText = Buffer.concat(chunks).toString('utf-8');
          resolve({
            status: res.statusCode || 0,
            headers: res.headers,
            text: rawText,
            json: async () => JSON.parse(rawText)
          });
        });
      }
    );

    req.on('error', reject);
    if (payload !== null) {
      req.write(payload);
    }
    req.end();
  });
}

async function startPipeServer(t) {
  const server = createAppServer();
  const pipePath = `/tmp/grounded-career-studio-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}.sock`;
  server._pipePath = pipePath;

  await new Promise((resolve, reject) => {
    const onError = (err) => {
      server.off('listening', onListening);
      reject(err);
    };
    const onListening = () => {
      server.off('error', onError);
      resolve();
    };
    server.once('error', onError);
    server.once('listening', onListening);
    server.listen(pipePath);
  });

  t.after(async () => {
    await new Promise((resolve) => server.close(() => resolve()));
  });

  return server;
}

test('health, profile, analysis, tailoring and exports are available', async (t) => {
  const server = await startPipeServer(t);

  const healthRes = await requestLocal(server, 'GET', '/api/health');
  assert.equal(healthRes.status, 200);
  const healthBody = await healthRes.json();
  assert.equal(healthBody.status, 'ok');

  const profileRes = await requestLocal(server, 'GET', '/api/profile');
  assert.equal(profileRes.status, 200);
  const profileBody = await profileRes.json();
  const profile = profileBody.profile || profileBody;
  assert.ok(profile && typeof profile === 'object');
  assert.ok(Array.isArray(profile.roles) && profile.roles.length > 0);

  const unverifiedIds = new Set();

  const collectRecords = (items = []) => {
    for (const item of items) {
      if (!item || typeof item !== 'object' || !item.id) continue;
      if (item.verificationStatus !== 'verified') {
        unverifiedIds.add(item.id);
      }
    }
  };

  collectRecords(profile.skills);
  collectRecords(profile.tools);
  collectRecords(profile.certifications);
  collectRecords(profile.education);
  collectRecords(profile.projects);
  collectRecords(profile.summaryVariants);
  for (const role of profile.roles) {
    collectRecords(role.accomplishments);
    for (const acc of role.accomplishments || []) {
      collectRecords(acc.metrics);
    }
  }

  const analyzeRes = await requestLocal(server, 'POST', '/api/analyze', {
    jobDescription: SAMPLE_JOB_DESCRIPTION,
    profile
  });
  assert.equal(analyzeRes.status, 200);
  const analysis = await analyzeRes.json();
  assert.ok(analysis && typeof analysis === 'object');

  const tailorRes = await requestLocal(server, 'POST', '/api/tailor', {
    jobDescription: SAMPLE_JOB_DESCRIPTION,
    profile
  });
  assert.equal(tailorRes.status, 200);
  const tailored = await tailorRes.json();
  assert.ok(tailored && typeof tailored === 'object');

  const draft = tailored.draft || tailored;
  const serializedDraft = JSON.stringify(draft);
  for (const badId of unverifiedIds) {
    assert.equal(
      serializedDraft.includes(badId),
      false,
      `Unverified record ${badId} leaked into tailored output`
    );
  }

  for (const format of ['text', 'markdown', 'json', 'audit']) {
    const exportRes = await requestLocal(server, 'POST', '/api/export', {
      format,
      jobDescription: SAMPLE_JOB_DESCRIPTION,
      profile,
      draft
    });
    assert.equal(exportRes.status, 200, `Expected 200 OK for export format "${format}"`);
    const exported = await exportRes.json();
    assert.ok(exported && typeof exported === 'object');
  }
});

test('fixtures endpoint returns grounded sample profiles and job descriptions', async (t) => {
  const server = await startPipeServer(t);

  const res = await requestLocal(server, 'GET', '/api/fixtures');
  assert.equal(res.status, 200);
  const payload = await res.json();
  assert.ok(payload && typeof payload === 'object');
});

test('unknown API route returns structured 404 JSON', async (t) => {
  const server = await startPipeServer(t);

  const res = await requestLocal(server, 'GET', '/api/non-existent-endpoint');
  assert.equal(res.status, 404);
  const payload = await res.json();
  assert.equal(payload.error, 'Not Found');
});
