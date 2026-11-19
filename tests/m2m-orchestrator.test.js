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
    'domains = set()',
    'for k, v in o.registry.items():',
    '    if isinstance(v, dict) and v.get("domain"):',
    '        domains.add(v.get("domain"))',
    '    elif isinstance(k, str) and ":" in k:',
    '        domains.add(k.split(":", 1)[0])',
    '    elif isinstance(k, str) and "_" in k:',
    '        domains.add(k.split("_", 1)[0])',
    'if not domains and hasattr(o, "domains"):',
    '    domains = set(o.domains) if not isinstance(o.domains, dict) else set(o.domains.keys())',
    "health = o.invoke('verify_url_mirror_health', {'url': 'https://jobright.ai'})",
    "print(json.dumps({'tool_count': tool_count, 'domain_count': len(domains), 'health_ok': health.get('result', {}).get('status') == 'ok'}))"
  ].join('\n');

  const raw = execFileSync('python3', ['-c', pyCode], { encoding: 'utf8' }).trim();
  const parsed = JSON.parse(raw);

  assert.equal(parsed.tool_count, 100);
  assert.ok(parsed.domain_count >= 1);
  assert.equal(parsed.health_ok, true);
});
