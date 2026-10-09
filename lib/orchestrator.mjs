import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { dispatch } from './runner.mjs';
import { memoryPointer } from './memory.mjs';
import { now, stablePrefix, projectDir } from './core.mjs';

function promptFor(cwd, task, role, extra = '') { const pointer = memoryPointer(cwd); return `${stablePrefix(cwd, task)}\nrole: ${role}\nmemory_pointer: ${pointer.uri}\n\n${task}\n${extra}`; }
export async function leader(cwd, task, providers, options = {}) {
  const roles = options.roles || ['implementer']; const results = [];
  for (const role of roles) { const result = await dispatch(promptFor(cwd, task, role), providers, { ...options, cwd }); results.push({ role, ...result }); if (options.stopOnSuccess && result.code === 0) break; }
  const event = { at: now(), kind: 'leader.dispatch', task, project_id: memoryPointer(cwd).project_id, results: results.map((r) => ({ role: r.role, provider: r.provider, model: r.model, code: r.code, rateLimited: r.rateLimited })) };
  const log = join(projectDir(cwd), 'runs.jsonl'); writeFileSync(log, `${JSON.stringify(event)}\n`, { flag: 'a', mode: 0o600 });
  return { task, results };
}
export async function roundtable(cwd, task, providers, options = {}) {
  const voters = options.voters || providers || ['claude', 'codex', 'kimi'];
  const proposals = await Promise.all(voters.map((provider) => dispatch(promptFor(cwd, task, 'independent voter', '\nReturn evidence, recommendation, and uncertainty. Do not read other votes.'), [provider], { ...options, cwd })));
  const digest = proposals.map((p, i) => `Voter ${i + 1} (${p.provider || voters[i]}):\n${p.stdout || p.stderr}`).join('\n\n');
  const synthesis = await dispatch(promptFor(cwd, task, 'chair', `\nBlind proposals follow. Compare evidence, preserve dissent, and return a decision with confidence.\n${digest}`), options.chairProviders || providers, { ...options, cwd });
  return { task, proposals: proposals.map((p, i) => ({ voter: voters[i], provider: p.provider, model: p.model, output: p.stdout, error: p.stderr, code: p.code })), synthesis: { provider: synthesis.provider, model: synthesis.model, output: synthesis.stdout, error: synthesis.stderr, code: synthesis.code } };
}
