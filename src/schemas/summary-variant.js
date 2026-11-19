import { isText, validateRecord } from './record.js';
export function validateSummaryVariant(value, label = 'summary variant') { return [...validateRecord(value, label), ...(!isText(value?.text) ? [`${label}.text is required`] : [])]; }
