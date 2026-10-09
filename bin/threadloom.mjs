#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initMemory, memoryPointer, readMemory, searchMemory, writeMemory } from '../lib/memory.mjs';
import { atomicWrite, commandExists, hash, home, projectDir, projectIdentity } from '../lib/core.mjs';
import { handoff } from '../lib/terminal.mjs';
import { leader, roundtable } from '../lib/orchestrator.mjs';

const argv = process.argv.slice(2); const command = argv.shift() || 'help';
function opts(args) { const out = { _: [] }; for (let i = 0; i < args.length; i += 1) { const x = args[i]; if (!x.startsWith('--')) { out._.push(x); continue; } const key = x.slice(2).replaceAll('-', '_'); const next = args[i + 1]; if (next && !next.startsWith('--')) { out[key] = next; i += 1; } else out[key] = true; } return out; }
function json(value) { process.stdout.write(`${JSON.stringify(value, null, 2)}\n`); }
function cwdOf(o) { return resolve(o.cwd || process.cwd()); }
function providers(o) { return (o.providers || o.provider || 'claude,codex,kimi').split(',').map((x) => x.trim()).filter(Boolean); }
async function main() {
  const o = opts(argv); const cwd = cwdOf(o);
  if (command === 'help' || command === '--help') { console.log(`Threadloom ${command}\n\nCommands:\n  memory init|read|write|search|pointer|status\n  leader --task TEXT [--providers claude,codex,kimi]\n  roundtable --task TEXT [--voters claude,codex,kimi]\n  handoff --prompt TEXT [--backend auto|tmux|cmux|file]\n  doctor [--json]\n\nSet THREADLOOM_HOME or AGENT_WEAVE_HOME to relocate state.`); return; }
  if (command === 'memory') {
    const sub = o._[0] || 'status';
    if (sub === 'init') return json(initMemory(cwd));
    if (sub === 'read') return process.stdout.write(`${readMemory(cwd, o.name || null)}\n`);
    if (sub === 'search') return json(searchMemory(cwd, o.query || o._[1] || ''));
    if (sub === 'pointer') return json(memoryPointer(cwd));
    if (sub === 'status') return json({ ...projectIdentity(cwd), home, pointer: memoryPointer(cwd) });
    if (sub === 'write' || sub === 'put') return json(writeMemory(cwd, { name: o.name || o._[1], description: o.description || 'Threadloom project memory', type: o.type || 'project', content: o.content || o._.slice(2).join(' '), expectedHash: o.expected_hash || null, source: o.source || 'cli' }));
    throw new Error(`unknown memory command: ${sub}`);
  }
  if (command === 'leader') return json(await leader(cwd, o.task || o._.join(' '), providers(o), { roles: o.roles ? o.roles.split(',') : undefined, timeoutMs: Number(o.timeout_ms || 120000) }));
  if (command === 'roundtable') return json(await roundtable(cwd, o.task || o._.join(' '), providers(o), { voters: (o.voters || o.providers || 'claude,codex,kimi').split(','), chairProviders: providers(o), timeoutMs: Number(o.timeout_ms || 120000) }));
  if (command === 'auto-butterfly') {
    if (!o.artifact) throw new Error('--artifact is required');
    const artifact = resolve(cwd, o.artifact); const text = readFileSync(artifact, 'utf8'); const currentHash = hash(text); const stateFile = join(projectDir(cwd), 'auto-butterfly.json');
    const previous = existsSync(stateFile) ? JSON.parse(readFileSync(stateFile, 'utf8')) : null; const changed = Boolean(previous && previous.hash !== currentHash);
    const result = { artifact, previous_hash: previous?.hash || null, current_hash: currentHash, changed, transcript: o.transcript || null, analysis: null };
    atomicWrite(stateFile, JSON.stringify({ hash: currentHash, artifact, at: new Date().toISOString() }, null, 2));
    if (changed && o.analyze) { const routed = await leader(cwd, `Use the butterfly-effect skill to diagnose whether ${artifact} was reworked because it missed the expected outcome. Transcript: ${o.transcript || 'current session'}. Return a rewind recommendation and updated prompt only when evidence supports it.`, providers(o), { roles: ['rewind-diagnostician'], timeoutMs: Number(o.timeout_ms || 120000) }); result.analysis = routed.results; }
    if (changed && o.handoff) result.handoff = await handoff(cwd, `Continue from the butterfly-effect analysis for ${artifact}. Read the memory pointer and transcript before acting.`, { backend: o.backend || 'auto', name: o.name, agent: o.agent, json: true });
    return json(result);
  }
  if (command === 'handoff') return json(await handoff(cwd, o.prompt || o._.join(' '), { backend: o.backend || 'auto', name: o.name, command: o.command, agent: o.agent, json: true }));
  if (command === 'doctor') {
    const checks = { node: process.versions.node, project: projectIdentity(cwd), memory: memoryPointer(cwd), claude: commandExists('claude'), codex: commandExists('codex'), kimi: commandExists('kimi'), tmux: commandExists('tmux'), cmux: commandExists('cmux'), plugin: existsSync(join(fileURLToPath(new URL('..', import.meta.url)), '.claude-plugin', 'plugin.json')) };
    if (o.json) return json({ ok: Boolean(checks.plugin && checks.memory), checks }); console.log(JSON.stringify({ ok: true, checks }, null, 2)); return;
  }
  throw new Error(`unknown command: ${command}`);
}
main().catch((error) => { console.error(`threadloom: ${error.message}`); process.exitCode = 1; });
