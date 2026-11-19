export const VERIFIED = 'verified';
export const STATUSES = new Set([VERIFIED, 'unverified', 'needs_review']);
export function validateRecord(record, label = 'record') {
  const errors = [];
  if (!record || typeof record !== 'object' || Array.isArray(record)) return [`${label} must be an object`];
  if (typeof record.id !== 'string' || !record.id.trim()) errors.push(`${label}.id is required`);
  if (typeof record.source !== 'string' || !record.source.trim()) errors.push(`${label}.source is required`);
  if (!STATUSES.has(record.verificationStatus)) errors.push(`${label}.verificationStatus must be verified, unverified, or needs_review`);
  return errors;
}
export function isText(value) { return typeof value === 'string' && value.trim().length > 0; }
export function validateArray(value, label, validator) { return Array.isArray(value) ? value.flatMap((item, index) => validator(item, `${label}[${index}]`)) : [`${label} must be an array`]; }
