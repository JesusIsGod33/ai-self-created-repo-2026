import { extractRequirements, mapRequirements } from './requirements.js';
import { buildTailoredResume } from './tailoring.js';
import { runAtsChecks } from '../ats/rules.js';

export function analyze(profile, jobDescription) {
  const requirements = extractRequirements(jobDescription);
  const mapped = mapRequirements(profile, requirements);
  const draft = buildTailoredResume(profile, jobDescription, { requirements, mapped });
  const ats = runAtsChecks(draft, profile);

  return {
    requirements,
    mapped,
    mapping: mapped,
    ats
  };
}
