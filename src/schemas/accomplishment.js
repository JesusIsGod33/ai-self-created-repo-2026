import { isText, validateRecord } from './record.js';
export function validateAccomplishment(value,label='accomplishment') { return [...validateRecord(value,label),...(!isText(value?.text)?[`${label}.text is required`]:[]),...(value?.skills!==undefined&&!Array.isArray(value.skills)?[`${label}.skills must be an array`]:[])]; }
