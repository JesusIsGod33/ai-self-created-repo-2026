import { getProfile } from '../../domain/store.js';
import { analyzeRequirements } from '../../domain/requirements/index.js';
import { buildTailoredDraft } from '../../domain/tailoring/builder.js';
import { runAtsChecks } from '../../ats/index.js';
import { readJson } from '../router.js';
import { validateJobDescription } from '../../schemas/job-description.js';
export const tailorRoutes = [['POST /api/tailor',async({req})=>{const body=await readJson(req);const errors=validateJobDescription(body);if(errors.length)throw Object.assign(new Error('Invalid job description'),{name:'ValidationError',details:errors});const profile=getProfile();const analysis=analyzeRequirements(profile,body.description);const draft=buildTailoredDraft(profile,analysis);return{analysis,draft,ats:runAtsChecks(profile,draft,analysis)};}]];
