import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

test('M2MOrchestrator registers 100 tools across 10 domains and validates mirror health', () => {
  const pyCode = [
    'import json, sys',
    "sys.path.insert(0, 'src/m2m')",
    'import orchestrator_engine as oe',
    'o = oe.M2MOrchestrator()',
    'tool_count = len(o.registry)',
    'domains = {getattr(v, "domain", None) for v in o.registry.values() if getattr(v, "domain", None)}',
    "health = o.invoke('verify_url_mirror_health', {'url': 'https://jobright.ai'})",
    "print(json.dumps({'tool_count': tool_count, 'domain_count': len(domains), 'health_ok': health.get('result', {}).get('status') == 'ok'}))"
  ].join('; ');

  const raw = execFileSync('python3', ['-c', pyCode], { encoding: 'utf8' }).trim();
  const parsed = JSON.parse(raw);

  assert.equal(parsed.tool_count, 100);
  assert.equal(parsed.domain_count, 10);
  assert.equal(parsed.health_ok, true);
});
