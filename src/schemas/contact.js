import { isText } from './record.js';
export function validateContact(value, label = 'contact') { if (!value || typeof value !== 'object') return [`${label} must be an object`]; const errors = []; if (!isText(value.name)) errors.push(`${label}.name is required`); if (value.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)) errors.push(`${label}.email must be valid`); return errors; }
