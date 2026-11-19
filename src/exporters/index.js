import { toPlainText } from './plain-text.js';
import { toMarkdown } from './markdown.js';
import { toJsonBundle } from './json-bundle.js';
import { toAuditReport } from './audit-report.js';
export function exportDocument(format,profile,draft,analysis={requirements:[]}) { const exporters={text:toPlainText,markdown:toMarkdown,json:toJsonBundle,audit:(p,d)=>toAuditReport(p,d,analysis)};if(!exporters[format])throw new RangeError(`Unsupported export format: ${format}`);return exporters[format](profile,draft); }
