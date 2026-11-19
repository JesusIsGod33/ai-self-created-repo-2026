import { isText, validateRecord } from './record.js';
export function validateCertification(value, label = 'certification') { return [...validateRecord(value, label), ...(!isText(value?.name) ? [`${label}.name is required`] : [])]; }
