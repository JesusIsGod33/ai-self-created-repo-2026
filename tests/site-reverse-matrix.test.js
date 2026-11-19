import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const outPath = path.resolve('data/site-reverse-engineering-matrix.json');

test('reverse engineering matrix creates thousands of structured entries in bulk', () => {
  assert.equal(fs.existsSync(outPath), true);
  const data = JSON.parse(fs.readFileSync(outPath, 'utf8'));
  assert.ok(data.totalEntries >= 4000, 'expected >= 4000 entries, got ' + data.totalEntries);
  assert.equal(data.entries.length, data.totalEntries);
});

test('every reverse engineering record enforces provenance lock state', () => {
  const data = JSON.parse(fs.readFileSync(outPath, 'utf8'));
  for (const entry of data.entries) {
    assert.ok(entry.id && entry.layerCode && entry.pillarCode);
    assert.equal(entry.provenance.provenanceLocked, entry.verificationStatus === 'verified');
  }
});
