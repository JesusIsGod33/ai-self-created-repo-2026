import { isText, validateRecord } from './record.js';
export function validateTool(value, label = 'tool') { return [...validateRecord(value, label), ...(!isText(value?.name) ? [`${label}.name is required`] : [])]; }
