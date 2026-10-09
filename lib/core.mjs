import { createHash } from 'node:crypto';
import { closeSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync, realpathSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, normalize } from 'node:path';
import { spawn } from 'node:child_process';
import { execFileSync } from 'node:child_process';

export const home = process.env.FOLDSPACE_HOME || join(process.env.XDG_STATE_HOME || join(homedir(), '.local', 'state'), 'foldspace');
export const now = () => new Date().toISOString();
export const hash = (value) => createHash('sha256').update(value).digest('hex');
export function jsonRead(file, fallback) { try { return JSON.parse(readFileSync(file, 'utf8')); } catch { return fallback; } }
export function ensureDir(dir) { mkdirSync(dir, { recursive: true, mode: 0o700 }); return dir; }
export function atomicWrite(file, content) {
  ensureDir(dirname(file));
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(tmp, content, { mode: 0o600 });
  const fd = openSync(tmp, 'r'); try { fsyncSync(fd); } finally { closeSync(fd); }
  renameSync(tmp, file);
}
export function commandExists(command) { try { execFileSync(command, ['--help'], { stdio: 'ignore', timeout: 2500 }); return true; } catch (error) { return error.code !== 'ENOENT'; } }
export function projectIdentity(cwd = process.cwd()) {
  const input = realpathSync(normalize(cwd));
  let root = input; let kind = 'path'; let common = null;
  try {
    root = realpathSync(execFileSync('git', ['-C', input, 'rev-parse', '--show-toplevel'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim());
    kind = 'git';
    try { const rawCommon = execFileSync('git', ['-C', input, 'rev-parse', '--git-common-dir'], { encoding: 'utf8' }).trim(); common = realpathSync(rawCommon.startsWith('/') ? rawCommon : join(input, rawCommon)); } catch { common = null; }
  } catch { /* non-git workspaces remain isolated by real path */ }
  const projectId = hash(`${kind}:${common || root}`).slice(0, 16);
  return { kind, root, commonDir: common, projectId, worktreeId: hash(root).slice(0, 16) };
}
export function projectDir(cwd) { return join(home, 'projects', projectIdentity(cwd).projectId); }
export function run(command, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd: options.cwd, env: { ...process.env, ...(options.env || {}) }, stdio: ['pipe', 'pipe', 'pipe'], detached: Boolean(options.detached) });
    let stdout = ''; let stderr = ''; let timedOut = false;
    const timer = options.timeoutMs ? setTimeout(() => { timedOut = true; child.kill('SIGTERM'); setTimeout(() => child.kill('SIGKILL'), 800).unref(); }, options.timeoutMs) : null;
    child.stdout.on('data', (chunk) => { stdout += chunk; }); child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', (error) => { if (timer) clearTimeout(timer); resolve({ code: null, signal: null, stdout, stderr: `${stderr}${error.message}`, timedOut }); });
    child.on('close', (code, signal) => { if (timer) clearTimeout(timer); resolve({ code, signal, stdout, stderr, timedOut }); });
    if (options.input) child.stdin.end(options.input); else child.stdin.end();
  });
}
export function rateLimited(text = '') { return /(?:\b429\b|rate[ -]?limit|quota|too many requests|overloaded|capacity|resource exhausted|try again later)/i.test(text); }
export function stablePrefix(cwd, task = '') {
  const id = projectIdentity(cwd); const memory = join(projectDir(cwd), 'memory', 'MEMORY.md');
  return `Foldspace context pointer\nproject_id: ${id.projectId}\nproject_root: ${id.root}\nmemory_index: ${memory}\ntask: ${task}`;
}
export function lockDir(lock) {
  ensureDir(dirname(lock));
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try { mkdirSync(lock, { mode: 0o700 }); atomicWrite(join(lock, 'owner.json'), JSON.stringify({ pid: process.pid, at: now() })); return () => rmSync(lock, { recursive: true, force: true }); } catch {
      try { const age = Date.now() - statSync(lock).mtimeMs; if (age > 120000) rmSync(lock, { recursive: true, force: true }); } catch { /* retry */ }
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 25);
    }
  }
  throw new Error(`memory lock timeout: ${lock}`);
}
