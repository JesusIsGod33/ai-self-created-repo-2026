import { createMemoryAdapter } from './persistence/memory.js';
import { validateProfile } from '../schemas/profile.js';
import initialProfile from '../fixtures/master-profile.json' with { type: 'json' };

const adapter = createMemoryAdapter(initialProfile);
export function getProfile() { return adapter.get(); }
export function replaceProfile(next) { const errors = validateProfile(next); if (errors.length) { const error = new Error(errors.join('; ')); error.name = 'ValidationError'; error.details = errors; throw error; } return adapter.replace(next); }
export function setPersistence(nextAdapter) { if (!nextAdapter || typeof nextAdapter.get !== 'function' || typeof nextAdapter.replace !== 'function') throw new TypeError('Persistence adapter must implement get and replace'); return nextAdapter; }
