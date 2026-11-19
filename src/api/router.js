import { profileRoutes } from './routes/profile.js';
import { analyzeRoutes } from './routes/analyze.js';
import { tailorRoutes } from './routes/tailor.js';
import { exportRoutes } from './routes/export.js';
import { healthRoutes } from './routes/health.js';
import { fixtureRoutes } from './routes/fixtures.js';
const routes = new Map([...profileRoutes,...analyzeRoutes,...tailorRoutes,...exportRoutes,...healthRoutes,...fixtureRoutes]);
export async function routeApi(req,res) {
  const url = new URL(req.url || '/', 'http://localhost');
  const handler = routes.get(`${req.method} ${url.pathname}`);
  if (!handler) return sendJson(res,404,{error:'Route not found'});
  try { const result = await handler({req,res,url}); if (result !== undefined && !res.writableEnded) sendJson(res,200,result); }
  catch (error) { const status = Number.isInteger(error.statusCode) ? error.statusCode : error.name === 'ValidationError' ? 400 : 500; if (status >= 500) console.error(error); sendJson(res,status,{error:status >= 500 ? 'Internal server error' : error.message, ...(error.details ? {details:error.details} : {})}); }
}
export function sendJson(res,status,value,headers={}) { res.writeHead(status,{'content-type':'application/json; charset=utf-8','x-content-type-options':'nosniff',...headers}); res.end(JSON.stringify(value)); }
export async function readJson(req,limit=1_000_000) {
  const chunks=[]; let size=0;
  for await (const chunk of req) { size += chunk.length; if (size > limit) { const error=new Error('Request body is too large'); error.statusCode=413; throw error; } chunks.push(chunk); }
  if (!size) return {};
  try { const value=JSON.parse(Buffer.concat(chunks).toString('utf8')); if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(); return value; }
  catch { const error=new Error('Request body must be a JSON object'); error.statusCode=400; throw error; }
}
