import { handleHealth } from './routes/health.js';
import { handleProfile } from './routes/profile.js';
import { handleAnalyze } from './routes/analyze.js';
import { handleTailor } from './routes/tailor.js';
import { handleExport } from './routes/export.js';
import { handleFixtures } from './routes/fixtures.js';

export async function routeRequest(ctx) {
  const { pathname } = ctx;

  if (pathname === '/health' || pathname === '/healthz' || pathname === '/api/health') {
    return handleHealth(ctx);
  }

  if (pathname === '/api/profile' || pathname.startsWith('/api/profile/')) {
    return handleProfile(ctx);
  }

  if (pathname === '/api/analyze' || pathname.startsWith('/api/analyze/')) {
    return handleAnalyze(ctx);
  }

  if (pathname === '/api/tailor' || pathname.startsWith('/api/tailor/')) {
    return handleTailor(ctx);
  }

  if (pathname === '/api/export' || pathname.startsWith('/api/export/')) {
    return handleExport(ctx);
  }

  if (pathname === '/api/fixtures' || pathname.startsWith('/api/fixtures/')) {
    return handleFixtures(ctx);
  }

  return false;
}

export default routeRequest;
