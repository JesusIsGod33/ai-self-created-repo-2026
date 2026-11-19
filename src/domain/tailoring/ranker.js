import { scoreRole } from './scorer.js';
export function rankRoles(roles,requirements) { return roles.map((role,index)=>({role,index,score:scoreRole(role,requirements)})).sort((a,b)=>b.score-a.score||a.index-b.index).map(item=>item.role); }
