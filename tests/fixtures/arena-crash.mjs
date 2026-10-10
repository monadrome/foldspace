import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { runArena } from '../../lib/arena.mjs';

const [source, input, config, batchId] = process.argv.slice(2);
await runArena(source, JSON.parse(readFileSync(input, 'utf8')), {
  profiles: JSON.parse(readFileSync(config, 'utf8')),
  batchId,
  offlineCollector: ({ workspace, candidateId }) =>
    writeFileSync(join(workspace, 'app.txt'), `implementation ${candidateId}\n`),
  onEvent: (event) => {
    if (event.kind === 'artifact.sealed' && event.candidateId === 'candidate-A')
      process.kill(process.pid, 'SIGKILL');
  },
});
