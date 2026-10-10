import { appendFileSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [mode, log] = process.argv.slice(2);
const event = (kind) =>
  appendFileSync(log, `${JSON.stringify({ kind, pid: process.pid, at: Date.now() })}\n`);
event('start');
if (mode === 'crash-once' && !existsSync(join(process.cwd(), 'first-launch'))) {
  writeFileSync(join(process.cwd(), 'first-launch'), String(process.pid));
  process.on('SIGTERM', () => {});
  setInterval(() => {}, 1000);
} else {
  let prompt = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => (prompt += chunk));
  process.stdin.on('end', () => {
    setTimeout(
      () => {
        event('end');
        console.log(mode === 'prompt' ? prompt : 'Local fixture completed.');
      },
      mode === 'sleep' ? 180 : 10,
    );
  });
}
