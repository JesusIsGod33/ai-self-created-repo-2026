import profile from '../../fixtures/master-profile.json' with {type:'json'};
import jobs from '../../fixtures/job-descriptions.json' with {type:'json'};
export const fixtureRoutes = [['GET /api/fixtures',()=>({jobs:structuredClone(jobs),profile:{contact:profile.contact,roleCount:profile.roles.length,verifiedSkillCount:profile.skills.filter(x=>x.verificationStatus==='verified').length}})]];
