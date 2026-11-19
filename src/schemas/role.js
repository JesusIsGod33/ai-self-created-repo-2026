import { isText, validateArray } from './record.js';
import { validateRecord } from './record.js';
import { validateAccomplishment } from './accomplishment.js';
export function validateRole(value,label='role') { if(!value||typeof value!=='object'||Array.isArray(value))return[`${label} must be an object`];return [...validateRecord(value,label),...(!isText(value.title)?[`${label}.title is required`]:[]),...(!isText(value.employer)?[`${label}.employer is required`]:[]),...validateArray(value.accomplishments??[],`${label}.accomplishments`,validateAccomplishment)]; }
