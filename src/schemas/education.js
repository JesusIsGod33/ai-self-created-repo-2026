import { isText, validateRecord } from './record.js';
export function validateEducation(value, label = 'education') { return [...validateRecord(value, label), ...(!isText(value?.institution) ? [`${label}.institution is required`] : [])]; }
