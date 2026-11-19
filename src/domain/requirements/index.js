import { extractRequirements } from './extractor.js';
import { buildEvidenceIndex } from './evidence-index.js';
import { canonicalSkill } from './skill-catalog.js';
export function matchRequirements(requirements,index) { return requirements.map(requirement=>{const evidence=index.get(canonicalSkill(requirement))||[];return{requirement,matched:evidence.length>0,evidence};}); }
export function analyzeRequirements(profile,description) { const requirements=extractRequirements(description);const matches=matchRequirements(requirements,buildEvidenceIndex(profile));const matched=matches.filter(item=>item.matched).length;return{requirements:matches,coverage:matches.length?Math.round(matched/matches.length*100):0,groundedOnly:true,verifiedEvidenceOnly:true}; }
