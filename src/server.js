import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { routeApi } from './api/router.js';

const publicDir = fileURLToPath(new URL('./public/', import.meta.url));
const mimeTypes = new Map([['.html','text/html; charset=utf-8'],['.css','text/css; charset=utf-8'],['.js','text/javascript; charset=utf-8'],['.json','application/json; charset=utf-8'],['.svg','image/svg+xml']]);
const securityHeaders = { 'x-content-type-options':'nosniff', 'referrer-policy':'no-referrer', 'content-security-policy':"default-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'" };
export function createApp() {
  return createServer(async (req, res) => {
    try {
      if (req.url?.startsWith('/api/')) return await routeApi(req, res);
      if (!['GET','HEAD'].includes(req.method || '')) return send(res,405,'Method not allowed','text/plain; charset=utf-8',{'allow':'GET, HEAD'});
      const pathname = new URL(req.url || '/', 'http://localhost').pathname;
      let decoded; try { decoded = decodeURIComponent(pathname); } catch { return send(res,400,'Malformed URL','text/plain; charset=utf-8'); }
      const target = resolve(publicDir, `.${decoded === '/' ? '/index.html' : decoded}`);
      if (target !== publicDir && !target.startsWith(`${publicDir}${sep}`)) return send(res,403,'Forbidden','text/plain; charset=utf-8');
      const body = await readFile(target);
      res.writeHead(200,{...securityHeaders,'content-type':mimeTypes.get(extname(target)) || 'application/octet-stream','cache-control':'no-store'});
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch (error) {
      if (error.code === 'ENOENT') return send(res,404,'Not found','text/plain; charset=utf-8');
      console.error(error); send(res,500,'Internal server error','text/plain; charset=utf-8');
    }
  });
}
function send(res,status,body,type,extra={}) { res.writeHead(status,{...securityHeaders,'content-type':type,...extra}); res.end(body); }
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const port = Number(process.env.PORT || 3000);
  createApp().listen(port,'0.0.0.0',() => console.log(`Grounded Career Studio listening on ${port}`));
}
