import { validateArray } from './record.js';
import { validateContact } from './contact.js';
import { validateRole } from './role.js';
import { validateAccomplishment } from './accomplishment.js';
import { validateMetric } from './metric.js';
import { validateSkill } from './skill.js';
import { validateTool } from './tool.js';
import { validateCertification } from './certification.js';
import { validateEducation } from './education.js';
import { validateProject } from './project.js';
import { validateSummaryVariant } from './summary-variant.js';
const collections={roles:validateRole,accomplishments:validateAccomplishment,metrics:validateMetric,skills:validateSkill,tools:validateTool,certifications:validateCertification,education:validateEducation,projects:validateProject,summaryVariants:validateSummaryVariant};
export function validateProfile(profile) { if(!profile||typeof profile!=='object'||Array.isArray(profile))return['profile must be an object'];const errors=validateContact(profile.contact);for(const [key,validator]of Object.entries(collections))errors.push(...validateArray(profile[key]??[],key,validator));return errors; }
