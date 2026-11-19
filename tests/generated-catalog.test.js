import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const catalogPath = path.resolve('data/generated-skills-catalog.json');

test('generated catalog scales to thousands of structured entries', () => {
  assert.equal(fs.existsSync(catalogPath), true, 'catalog JSON file must exist');
  const payload = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  assert.ok(payload.totalEntries >= 10000, 'expected >= 10000 entries, got ' + payload.totalEntries);
  assert.equal(payload.entries.length, payload.totalEntries);
  assert.ok(payload.verifiedEntries > 0);
  assert.ok(payload.unverifiedEntries > 0);
});

test('every generated catalog item preserves provenance lock invariants', () => {
  const payload = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  for (const item of payload.entries) {
    assert.ok(item.id && item.name && item.workflowPillar);
    assert.ok(item.provenance && typeof item.provenance.source === 'string');
    if (item.verificationStatus === 'verified') {
      assert.equal(item.provenance.locked, true);
    } else {
      assert.equal(item.provenance.locked, false);
    }
  }
});
