import profile from '../../fixtures/master-profile.json' with { type: 'json' };
import jobs from '../../fixtures/job-descriptions.json' with { type: 'json' };
export const fixtureRoutes = [['GET /api/fixtures', () => ({ profile, jobs })]];
