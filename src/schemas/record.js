export const VERIFICATION_STATUSES = Object.freeze(['verified','unverified','needs_review']);
export const VERIFIED = 'verified';
export function validateRecord(record,label='record') { if (!record || typeof record!=='object' || Array.isArray(record)) return [`${label} must be an object`]; const errors=[]; for (const key of ['id','source']) if (typeof record[key]!=='string'||!record[key].trim()) errors.push(`${label}.${key} is required`); if (!VERIFICATION_STATUSES.includes(record.verificationStatus)) errors.push(`${label}.verificationStatus must be one of ${VERIFICATION_STATUSES.join(', ')}`); return errors; }
export function validateArray(value,label,validator) { return Array.isArray(value)?value.flatMap((item,index)=>validator(item,`${label}[${index}]`)):[`${label} must be an array`]; }
export function isText(value) { return typeof value==='string'&&value.trim().length>0; }
export function isVerified(record) { return record?.verificationStatus===VERIFIED && Boolean(record.id && record.source); }
