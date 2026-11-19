import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const MAX_CYCLES = Number(process.env.ULTRON_MAX_CYCLES || 6);

function runCommand(cmd, args, cwd = ROOT_DIR) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd, env: { ...process.env } });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => {
      stdout += d.toString();
    });
    child.stderr.on('data', (d) => {
      stderr += d.toString();
    });
    child.on('close', (code) => {
      resolve({
        code: code ?? 1,
        stdout,
        stderr,
        combined: `${stdout}\n${stderr}`.trim()
      });
    });
  });
}

async function applyUltronTailoringModuleHeal() {
  const tailoringFile = path.join(ROOT_DIR, 'src/domain/tailoring.js');
  const healedTailoring = `import { extractRequirements, mapRequirements } from './requirements.js';
import { buildTailoredDraft } from './tailoring/builder.js';

function isVerified(record) {
  return Boolean(record && typeof record === 'object' && record.verificationStatus === 'verified');
}

export function buildTailoredResume(profileOrInput, maybeJd, maybeCtx) {
  let profile = profileOrInput;
  let jobDescription = maybeJd;
  let analysis = maybeCtx;

  if (
    profileOrInput &&
    typeof profileOrInput === 'object' &&
    !Array.isArray(profileOrInput) &&
    !profileOrInput.roles &&
    !profileOrInput.skills &&
    (profileOrInput.profile || profileOrInput.jobDescription || profileOrInput.analysis)
  ) {
    profile = profileOrInput.profile || {};
    jobDescription = profileOrInput.jobDescription || '';
    analysis = profileOrInput.analysis || null;
  }

  const jdText =
    typeof jobDescription === 'string'
      ? jobDescription
      : String(jobDescription?.text || jobDescription?.description || '');

  const requirements = Array.isArray(analysis?.requirements)
    ? analysis.requirements
    : extractRequirements(jdText);
  const mapped = Array.isArray(analysis?.mapped)
    ? analysis.mapped
    : Array.isArray(analysis?.mapping)
      ? analysis.mapping
      : mapRequirements(profile || {}, requirements);

  const verifiedSkills = (Array.isArray(profile?.skills) ? profile.skills : []).filter(isVerified);
  const verifiedTools = (Array.isArray(profile?.tools) ? profile.tools : []).filter(isVerified);
  const verifiedRoles = (Array.isArray(profile?.roles) ? profile.roles : [])
    .filter(isVerified)
    .map((role) => ({
      ...role,
      accomplishments: (Array.isArray(role.accomplishments) ? role.accomplishments : [])
        .filter(isVerified)
        .map((acc) => ({
          ...acc,
          evidenceId: acc.evidenceId || acc.id || null
        }))
    }));

  const verifiedSummaries = (Array.isArray(profile?.summaryVariants) ? profile.summaryVariants : []).filter(isVerified);
  const summary =
    verifiedSummaries[0]?.text ||
    verifiedSummaries[0]?.summary ||
    (typeof profile?.headline === 'string' ? profile.headline : '') ||
    (verifiedRoles[0]?.title ? String(verifiedRoles[0].title) + ' grounded in verified experience.' : 'Grounded candidate profile.');

  return {
    contact: profile?.contact || null,
    headline: summary,
    summary,
    roles: verifiedRoles,
    skills: verifiedSkills,
    tools: verifiedTools,
    certifications: (Array.isArray(profile?.certifications) ? profile.certifications : []).filter(isVerified),
    education: (Array.isArray(profile?.education) ? profile.education : []).filter(isVerified),
    projects: (Array.isArray(profile?.projects) ? profile.projects : []).filter(isVerified),
    mapping: mapped,
    provenancePolicy: 'strict-verified-only',
    jobDescription: jdText
  };
}

export function toPlainText(draft) {
  if (!draft) return '';
  if (typeof draft === 'string') return draft;
  const parts = [];
  if (draft.contact?.name) parts.push(String(draft.contact.name));
  if (draft.summary) parts.push(String(draft.summary));
  for (const role of Array.isArray(draft.roles) ? draft.roles : []) {
    if (role.title) parts.push([role.title, role.company, role.period].filter(Boolean).join(' - '));
    for (const acc of Array.isArray(role.accomplishments) ? role.accomplishments : []) {
      const text = typeof acc === 'string' ? acc : acc?.text || acc?.statement || '';
      if (text) parts.push(text);
    }
  }
  for (const sk of Array.isArray(draft.skills) ? draft.skills : []) {
    const label = typeof sk === 'string' ? sk : sk?.name || sk?.label || '';
    if (label) parts.push(label);
  }
  return parts.join(String.fromCharCode(10)).trim();
}

export { buildTailoredDraft };
export default { buildTailoredResume, buildTailoredDraft, toPlainText };
`;
  const existing = await fs.readFile(tailoringFile, 'utf-8').catch(() => '');
  if (existing !== healedTailoring) {
    await fs.mkdir(path.dirname(tailoringFile), { recursive: true });
    await fs.writeFile(tailoringFile, healedTailoring, 'utf-8');
    return true;
  }
  return false;
}

async function runUltronSelfHealer() {
  for (let cycle = 1; cycle <= MAX_CYCLES; cycle++) {
    const result = await runCommand('npm', ['test']);
    if (result.code === 0) {
      process.stdout.write(result.stdout);
      return;
    }
    const patched = await applyUltronTailoringModuleHeal();
    if (!patched && cycle > 1) {
      process.stderr.write(result.combined + '\n');
      process.exitCode = 1;
      return;
    }
  }

  const finalResult = await runCommand('npm', ['test']);
  process.stdout.write(finalResult.combined + '\n');
  if (finalResult.code !== 0) {
    process.exitCode = 1;
  }
}

runUltronSelfHealer();
