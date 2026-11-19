import { scoreRole } from './scorer.js';
export function rankRoles(roles, requirements) { return [...roles].sort((a, b) => scoreRole(b, requirements) - scoreRole(a, requirements)); }
