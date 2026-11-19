import { isText, validateRecord } from './record.js';
export function validateAccomplishment(value, label = 'accomplishment') { return [...validateRecord(value, label), ...(!isText(value?.text) ? [`${label}.text is required`] : [])]; }
