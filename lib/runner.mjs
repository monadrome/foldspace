import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { commandExists, home, run, rateLimited } from './core.mjs';

export const defaults = {
  claude: { command: 'claude', model: process.env.THREADLOOM_CLAUDE_MODEL || 'sonnet' },
  codex: { command: 'codex', model: process.env.THREADLOOM_CODEX_MODEL || 'gpt-5' },
  kimi: { command: 'kimi', model: process.env.THREADLOOM_KIMI_MODEL || 'kimi-k2.5' }
};
export function loadProfiles(cwd) {
  const files = [join(cwd, '.threadloom', 'agents.json'), join(home, 'agents.json')];
  for (const file of files) {
    if (!existsSync(file)) continue;
    try { const parsed = JSON.parse(readFileSync(file, 'utf8')); return parsed.providers || parsed; } catch { /* malformed config is ignored; the doctor can still run */ }
  }
  return {};
}
function argsFor(provider, prompt, spec) {
  if (provider === 'claude') return ['-p', prompt, '--output-format', 'text', '--model', spec.model, ...(spec.fallbackModel ? ['--fallback-model', spec.fallbackModel] : [])];
  if (provider === 'codex') return ['exec', prompt, '--ephemeral', '--sandbox', spec.readonly === false ? 'workspace-write' : 'read-only', '-m', spec.model];
  if (provider === 'kimi') return ['--auto', '-p', prompt, '--output-format', 'text', '-m', spec.model];
  return spec.args ? spec.args.map((x) => x.replaceAll('{prompt}', prompt)) : [prompt];
}
export async function invoke(provider, prompt, spec = {}, options = {}) {
  const profile = { ...(defaults[provider] || {}), ...spec }; const command = profile.command || provider;
  if (!commandExists(command)) return { provider, model: profile.model, code: null, stdout: '', stderr: `${command} unavailable`, unavailable: true };
  const result = await run(command, argsFor(provider, prompt, profile), { cwd: options.cwd, timeoutMs: options.timeoutMs || profile.timeoutMs || 120000 });
  return { ...result, provider, model: profile.model, rateLimited: rateLimited(`${result.stdout}\n${result.stderr}`) };
}
export async function dispatch(prompt, providers, options = {}) {
  const attempts = []; const list = providers?.length ? providers : ['claude', 'codex', 'kimi'];
  const profiles = options.profiles || loadProfiles(options.cwd || process.cwd());
  for (const provider of list) { const result = await invoke(provider, prompt, profiles?.[provider], options); attempts.push(result); if (result.code === 0 && result.stdout.trim()) return { ...result, attempts }; if (!result.rateLimited && !result.unavailable && result.code !== 0) break; }
  return { ...(attempts.at(-1) || { code: null, stdout: '', stderr: 'no providers configured' }), attempts };
}
