import { rankRoles } from './ranker.js';
import { groupRoles } from './role-grouper.js';
import { selectSummary } from './summary-selector.js';
import { isVerified } from '../../schemas/record.js';
const verified=items=>(items||[]).filter(isVerified).map(item=>structuredClone(item));
export function buildTailoredDraft(profile,analysis) { const roles=groupRoles(rankRoles(profile.roles||[],analysis.requirements)).filter(isVerified).map(role=>({...role,accomplishments:verified(role.accomplishments)})).filter(role=>role.accomplishments.length);return{contact:structuredClone(profile.contact),summary:selectSummary(profile,analysis.requirements),roles,skills:verified(profile.skills),tools:verified(profile.tools),education:verified(profile.education),certifications:verified(profile.certifications),projects:verified(profile.projects),metrics:verified(profile.metrics),groundedOnly:true}; }
