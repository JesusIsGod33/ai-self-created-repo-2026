import { toPlainText } from './plain-text.js';
import { toMarkdown } from './markdown.js';
import { toJsonBundle } from './json-bundle.js';
import { toAuditReport } from './audit-report.js';
export function exportDocument(format, profile, draft, analysis = { requirements: [] }) { if (format === 'text') return toPlainText(profile, draft); if (format === 'markdown') return toMarkdown(profile, draft); if (format === 'json') return toJsonBundle(profile, draft); if (format === 'audit') return toAuditReport(profile, draft, analysis); throw new Error('Unsupported export format'); }
