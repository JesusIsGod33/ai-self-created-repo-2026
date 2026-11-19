import { getProfile } from '../../domain/store.js';
import { analyzeRequirements } from '../../domain/requirements/index.js';
import { readJson } from '../router.js';
import { validateJobDescription } from '../../schemas/job-description.js';
export const analyzeRoutes = [['POST /api/analyze',async({req})=>{const body=await readJson(req);const errors=validateJobDescription(body);if(errors.length)throw Object.assign(new Error('Invalid job description'),{name:'ValidationError',details:errors});return analyzeRequirements(getProfile(),body.description);}]];
