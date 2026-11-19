import { getProfile, replaceProfile } from '../../domain/store.js';
import { readJson } from '../router.js';
export const profileRoutes = [['GET /api/profile', () => getProfile()], ['PUT /api/profile', async ({ req }) => replaceProfile(await readJson(req))]];
