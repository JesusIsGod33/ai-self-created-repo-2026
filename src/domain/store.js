import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_PROFILE_PATH = path.resolve(__dirname, '../fixtures/master-profile.json');

function cloneValue(value) {
  return structuredClone(value);
}

function loadDefaultProfile() {
  const raw = fs.readFileSync(DEFAULT_PROFILE_PATH, 'utf-8');
  return JSON.parse(raw);
}

export function createStore(initialProfile) {
  let currentProfile = initialProfile ? cloneValue(initialProfile) : loadDefaultProfile();

  return {
    getProfile() {
      return cloneValue(currentProfile);
    },
    setProfile(nextProfile) {
      currentProfile = cloneValue(nextProfile);
      return cloneValue(currentProfile);
    },
    reset() {
      currentProfile = loadDefaultProfile();
      return cloneValue(currentProfile);
    }
  };
}

export default createStore;
