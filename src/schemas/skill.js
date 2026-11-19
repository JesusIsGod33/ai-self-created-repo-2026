import { isText, validateRecord } from './record.js';
export function validateSkill(value, label = 'skill') { return [...validateRecord(value, label), ...(!isText(value?.name) ? [`${label}.name is required`] : [])]; }
