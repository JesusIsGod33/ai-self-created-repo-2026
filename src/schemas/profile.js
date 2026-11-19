import { isText, validateArray } from './record.js';
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
export function validateProfile(profile) {
  if (!profile || typeof profile !== 'object') return ['profile must be an object'];
  const errors = [];
  if (!profile.contact || typeof profile.contact !== 'object') errors.push('contact is required'); else errors.push(...validateContact(profile.contact));
  for (const [field, validator] of Object.entries({ roles: validateRole, skills: validateSkill, tools: validateTool, certifications: validateCertification, education: validateEducation, projects: validateProject, summaryVariants: validateSummaryVariant, accomplishments: validateAccomplishment, metrics: validateMetric })) errors.push(...validateArray(profile[field] ?? [], field, validator));
  if (!isText(profile.contact?.name)) errors.push('profile must have a contact name');
  return errors;
}
