import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { atomicWrite, commandExists, run, ensureDir, home, now, projectIdentity } from './core.mjs';
const shellQuote = (value) => `'${String(value).replaceAll("'", "'\\''")}'`;
export async function handoff(cwd, prompt, options = {}) {
  const name = options.name || `threadloom-${projectIdentity(cwd).projectId}-${Date.now().toString(36)}`;
  const command = options.command || process.env.SHELL || '/bin/sh'; const backend = options.backend === 'auto' ? (commandExists('cmux') ? 'cmux' : commandExists('tmux') ? 'tmux' : 'file') : (options.backend || 'auto');
  const selected = backend === 'auto' ? (commandExists('cmux') ? 'cmux' : commandExists('tmux') ? 'tmux' : 'file') : backend;
  const record = { name, backend: selected, prompt, cwd, started_at: now(), project_id: projectIdentity(cwd).projectId };
  record.file = join(home, 'handoffs', `${name}.md`); ensureDir(join(home, 'handoffs')); atomicWrite(record.file, `# Threadloom handoff\n\n${prompt}\n`);
  const launch = options.agent ? `${options.agent} -p "$(cat ${shellQuote(record.file)})"` : `printf '\\nThreadloom prompt: ${shellQuote(record.file)}\\n'; exec ${shellQuote(command)}`;
  if (selected === 'tmux') { const result = await run('tmux', ['-L', `threadloom-${process.pid}`, 'new-session', '-d', '-s', name, '-c', cwd, 'sh', '-lc', launch]); record.ref = name; record.code = result.code; }
  else if (selected === 'cmux') { const result = await run('cmux', ['workspace', 'create', '--name', name, '--cwd', cwd, '--command', `sh -lc ${shellQuote(launch)}`, '--focus', 'false']); record.ref = result.stdout.trim(); record.code = result.code; }
  else record.code = 0;
  if (options.json) return record; return `${selected} handoff ${record.ref || record.file || name}`;
}
