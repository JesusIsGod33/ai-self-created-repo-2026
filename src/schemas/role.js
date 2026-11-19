import { isText } from './record.js';
export function validateRole(value, label = 'role') { if (!value || typeof value !== 'object') return [`${label} must be an object`]; return [!isText(value.title) && `${label}.title is required`, !isText(value.employer) && `${label}.employer is required`, !Array.isArray(value.accomplishments) && `${label}.accomplishments must be an array`].filter(Boolean); }
