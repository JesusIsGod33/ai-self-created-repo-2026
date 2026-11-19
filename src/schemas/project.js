import { isText, validateRecord } from './record.js';
export function validateProject(value,label='project') { return [...validateRecord(value,label),...(!isText(value?.name)?[`${label}.name is required`]:[])]; }
