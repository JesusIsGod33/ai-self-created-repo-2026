import { validateRecord } from './record.js';
export function validateMetric(value,label='metric') { return [...validateRecord(value,label),...(value?.value===undefined||value.value===null||value.value===''?[`${label}.value is required`]:[]),...(value?.label!==undefined&&typeof value.label!=='string'?[`${label}.label must be a string`]:[])]; }
