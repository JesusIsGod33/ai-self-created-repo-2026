// Minimal standalone server used by tests/verify-commerce-e2e.mjs. In production, call
// mountCommerce(app) from server/index.js instead (before express.json()).
import express from 'express';
import { mountCommerce } from './routes.js';

const app = express();
app.disable('x-powered-by');
mountCommerce(app);
app.get('/api/health', (req, res) => res.json({ ok: true }));

const port = Number(process.env.PORT || 4080);
app.listen(port, '127.0.0.1', () => console.log(`[commerce] listening on http://127.0.0.1:${port}`));
