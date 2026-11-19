import test from 'node:test';
import assert from 'node:assert/strict';
import { validateProfile } from '../src/schemas/profile.js';
import { analyzeRequirements } from '../src/domain/requirements/index.js';
import { buildTailoredDraft } from '../src/domain/tailoring/builder.js';
import profile from '../src/fixtures/master-profile.json' with { type: 'json' };

test('fixture profile satisfies provenance schema', () => assert.deepEqual(validateProfile(profile), []));
test('analysis only matches verified profile evidence', () => { const result = analyzeRequirements(profile, 'Project management, JavaScript and leadership are required.'); assert.equal(result.requirements.find(x => x.requirement === 'project management').matched, true); assert.equal(result.requirements.find(x => x.requirement === 'javascript').matched, false); });
test('tailored draft excludes unverified claims and preserves provenance', () => { const draft = buildTailoredDraft(profile, analyzeRequirements(profile, 'SQL project management')); const text = JSON.stringify(draft); assert.equal(text.includes('Improved onboarding outcomes by 40 percent'), false); assert.equal(text.includes('JavaScript'), false); for (const record of [...draft.skills, ...draft.roles.flatMap(role => role.accomplishments)]) { assert.ok(record.id); assert.ok(record.source); assert.equal(record.verificationStatus, 'verified'); } });
