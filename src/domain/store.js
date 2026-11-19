import { createMemoryAdapter } from './persistence/memory.js';
import { validateProfile } from '../schemas/profile.js';
import initialProfile from '../fixtures/master-profile.json' with {type:'json'};
let adapter=createMemoryAdapter(initialProfile);
function assertValid(profile){const errors=validateProfile(profile);if(errors.length)throw Object.assign(new Error(errors.join('; ')),{name:'ValidationError',details:errors});}
export function getProfile(){return structuredClone(adapter.get());}
export function replaceProfile(next){assertValid(next);return adapter.replace(next);}
export function setPersistence(nextAdapter){if(!nextAdapter||typeof nextAdapter.get!=='function'||typeof nextAdapter.replace!=='function')throw new TypeError('Persistence adapter must implement get and replace');adapter=nextAdapter;return adapter;}
export function resetPersistence(){adapter=createMemoryAdapter(initialProfile);}
