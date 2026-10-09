import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { atomicWrite, ensureDir, hash, home, lockDir, now, projectDir, projectIdentity } from './core.mjs';

function paths(cwd) { const dir = join(projectDir(cwd), 'memory'); return { dir, index: join(dir, 'MEMORY.md'), topics: join(dir, 'topics'), lock: join(dir, '.lock') }; }
function rebuild(cwd) {
  const p = paths(cwd); ensureDir(p.topics); const rows = [];
  for (const file of readdirSync(p.topics).filter((x) => x.endsWith('.md')).sort()) {
    const text = readFileSync(join(p.topics, file), 'utf8'); const first = text.split('\n').find((line) => line.startsWith('description:')) || ''; const name = text.split('\n').find((line) => line.startsWith('name:')) || `name: ${file}`;
    rows.push(`- [${name.slice(6)}](topics/${file}) - ${first.slice(13)}`);
  }
  const identity = projectIdentity(cwd); const body = `# Foldspace project memory\n\nproject_id: ${identity.projectId}\nupdated_at: ${now()}\n\n${rows.join('\n')}\n`;
  atomicWrite(p.index, body.slice(0, 25000)); return p.index;
}
export function initMemory(cwd = process.cwd()) { const p = paths(cwd); ensureDir(p.topics); if (!existsSync(p.index)) rebuild(cwd); return { ...projectIdentity(cwd), index: p.index, dir: p.dir }; }
export function writeMemory(cwd, { name, description, type = 'project', content, expectedHash = null, source = 'agent' }) {
  if (!/^[a-z0-9][a-z0-9._-]{0,63}$/i.test(name)) throw new Error('memory name must be a simple filename');
  const p = paths(cwd); initMemory(cwd); const file = join(p.topics, `${name}.md`); const release = lockDir(p.lock);
  try {
    const current = existsSync(file) ? readFileSync(file, 'utf8') : ''; if (expectedHash && hash(current) !== expectedHash) throw new Error('memory_conflict');
    atomicWrite(file, `---\nname: ${name}\ndescription: ${description.replace(/[\r\n]/g, ' ')}\ntype: ${type}\nproject_id: ${projectIdentity(cwd).projectId}\nupdated_at: ${now()}\nsource_agent: ${source}\n---\n\n${content.trim()}\n`); rebuild(cwd); return { file, hash: hash(readFileSync(file, 'utf8')) };
  } finally { release(); }
}
export function readMemory(cwd, name = null) { const p = paths(cwd); initMemory(cwd); if (!name) return readFileSync(p.index, 'utf8'); if (!/^[a-z0-9][a-z0-9._-]{0,63}$/i.test(name)) throw new Error('invalid memory name'); const file = join(p.topics, `${name}.md`); return readFileSync(file, 'utf8'); }
export function searchMemory(cwd, query) { const p = paths(cwd); initMemory(cwd); return readdirSync(p.topics).filter((x) => x.endsWith('.md')).map((x) => ({ file: x, text: readFileSync(join(p.topics, x), 'utf8') })).filter((row) => row.text.toLowerCase().includes(query.toLowerCase())).map((row) => row.file); }
export function memoryPointer(cwd = process.cwd()) { const p = paths(cwd); initMemory(cwd); const content = readFileSync(p.index, 'utf8'); return { uri: `memory://project/${projectIdentity(cwd).projectId}/MEMORY.md#sha256=${hash(content)}`, path: p.index, project_id: projectIdentity(cwd).projectId, worktree_id: projectIdentity(cwd).worktreeId };
}
