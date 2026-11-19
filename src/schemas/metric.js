import { validateRecord } from './record.js';
export function validateMetric(value, label = 'metric') { return [...validateRecord(value, label), ...(value?.value === undefined ? [`${label}.value is required`] : [])]; }
