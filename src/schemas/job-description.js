import { isText } from './record.js';
export function validateJobDescription(value,label='job description') { return value&&typeof value==='object'&&isText(value.description)?[]:[`${label}.description is required`]; }
