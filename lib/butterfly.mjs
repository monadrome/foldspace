import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hash, now, projectDir, stateHome } from './core.mjs';
import { atomicWrite, ensureDir } from './storage.mjs';
import { assertNoSecrets, redactData } from './security.mjs';
import { check, choice, id, keys, number, text } from './validation.mjs';
import { dispatch } from './runner.mjs';
import { handoff } from './terminal.mjs';

const contractFile = fileURLToPath(new URL('../skills/butterfly-effect/SKILL.md', import.meta.url));
const sourceFile = fileURLToPath(
  new URL('../skills/butterfly-effect/references/source-resolution.md', import.meta.url),
);
const KINDS = [
  'objective',
  'requirement',
  'action',
  'produce',
  'feedback',
  'accept',
  'rework',
  'status',
];

function privateRedaction(value) {
  const safe = redactData(value);
  const visit = (input) => {
    if (typeof input === 'string')
      return input.replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[PRIVATE]');
    if (Array.isArray(input)) return input.map(visit);
    if (input && typeof input === 'object')
      return Object.fromEntries(Object.entries(input).map(([key, val]) => [key, visit(val)]));
    return input;
  };
  return visit(safe);
}

export function validateHistory(input) {
  keys(input, ['version', 'artifacts', 'transcript'], 'butterfly input');
  check(input.version === 1, 'Butterfly input version must be 1');
  check(
    Array.isArray(input.artifacts) && input.artifacts.length > 0 && input.artifacts.length <= 64,
    'Butterfly requires 1-64 artifacts',
  );
  check(
    Array.isArray(input.transcript) && input.transcript.length <= 10000,
    'Butterfly requires a chronological transcript array',
  );
  const artifacts = new Set();
  for (const artifact of input.artifacts) {
    keys(artifact, ['id', 'path'], 'artifact');
    id(artifact.id, 'artifact id');
    check(!artifacts.has(artifact.id), 'Duplicate artifact');
    artifacts.add(artifact.id);
    if (artifact.path !== undefined) text(artifact.path, 'artifact path', 4096);
  }
  const events = new Set();
  let lastOrder = -1;
  const versions = new Set();
  for (const event of input.transcript) {
    keys(
      event,
      [
        'id',
        'order',
        'actor',
        'kind',
        'text',
        'artifactId',
        'versionId',
        'hash',
        'replaces',
        'requirementIds',
        'feedbackId',
        'causeActionId',
        'reason',
      ],
      'transcript event',
    );
    id(event.id, 'event id');
    check(!events.has(event.id), 'Duplicate transcript event');
    events.add(event.id);
    number(event.order, 'event order', 0, 100000000);
    check(event.order > lastOrder, 'Transcript must be strictly chronological');
    lastOrder = event.order;
    choice(event.actor, ['user', 'agent'], 'transcript actor');
    choice(event.kind, KINDS, 'transcript kind');
    if (event.text !== undefined) text(event.text, 'event text', 100000);
    if (event.artifactId !== undefined)
      check(artifacts.has(event.artifactId), 'Unknown event artifact');
    if (event.requirementIds !== undefined)
      check(
        Array.isArray(event.requirementIds) &&
          event.requirementIds.every((x) => typeof x === 'string'),
        'requirementIds must be IDs',
      );
    for (const key of ['versionId', 'replaces', 'feedbackId', 'causeActionId'])
      if (event[key] !== undefined) id(event[key], key);
    if (['produce', 'rework'].includes(event.kind)) {
      check(
        event.actor === 'agent' &&
          event.artifactId &&
          event.versionId &&
          /^[a-f0-9]{64}$/.test(event.hash),
        'Artifact production needs agent, artifactId, versionId and SHA-256',
      );
      const key = `${event.artifactId}:${event.versionId}`;
      check(!versions.has(key), 'Duplicate artifact version');
      versions.add(key);
    }
    if (['objective', 'requirement', 'feedback', 'accept'].includes(event.kind))
      check(event.actor === 'user' && event.text, 'Authoritative history event requires user text');
    if (event.kind === 'rework')
      choice(event.reason, ['missed_requirement', 'ordinary_evolution'], 'rework reason');
  }
  return privateRedaction(input);
}

export function detectDrift(input) {
  const history = validateHistory(input);
  const events = history.transcript;
  const decisions = [],
    noOps = [];
  const objective = events.find((e) => e.kind === 'objective');
  for (const artifact of history.artifacts) {
    const drifts = [];
    for (const rework of events.filter(
      (e) => e.kind === 'rework' && e.artifactId === artifact.id,
    )) {
      const prior = events.find(
        (e) =>
          ['produce', 'rework'].includes(e.kind) &&
          e.artifactId === artifact.id &&
          e.versionId === rework.replaces &&
          e.order < rework.order,
      );
      const feedback = events.find(
        (e) =>
          e.id === rework.feedbackId &&
          e.kind === 'feedback' &&
          e.artifactId === artifact.id &&
          e.versionId === rework.replaces &&
          e.order > (prior?.order ?? Infinity) &&
          e.order < rework.order,
      );
      const requirements = (rework.requirementIds || []).map((name) =>
        events.find(
          (e) =>
            e.id === name &&
            e.kind === 'requirement' &&
            (!e.artifactId || e.artifactId === artifact.id),
        ),
      );
      const cause = feedback?.causeActionId
        ? events.find(
            (e) =>
              e.id === feedback.causeActionId &&
              e.actor === 'agent' &&
              ['action', 'produce', 'rework'].includes(e.kind) &&
              e.order <= (prior?.order ?? -1) &&
              e.artifactId === artifact.id,
          )
        : prior;
      let gap = null;
      if (!objective) gap = 'Missing original objective';
      else if (rework.reason === 'ordinary_evolution')
        gap = 'Ordinary evolution after acceptance or new requirements';
      else if (!prior || !feedback || !cause)
        gap = 'Missing produced version, authoritative feedback, or visible causal action';
      else if (prior.hash === rework.hash) gap = 'No artifact rework: identical content hash';
      else if (
        !requirements.length ||
        requirements.some(
          (r) => !r || r.order >= prior.order || !(feedback.requirementIds || []).includes(r.id),
        )
      )
        gap =
          'Feedback does not anchor a missed requirement that existed before the produced version';
      else if (
        events.some(
          (e) =>
            e.kind === 'accept' &&
            e.artifactId === artifact.id &&
            e.versionId === prior.versionId &&
            e.order > prior.order &&
            e.order < feedback.order,
        )
      )
        gap = 'Accepted artifact followed by ordinary evolution';
      if (gap) {
        noOps.push({ artifactId: artifact.id, eventId: rework.id, reason: gap });
        continue;
      }
      drifts.push({ rework, prior, feedback, cause, requirements });
    }
    if (!drifts.length) continue;
    drifts.sort((a, b) => a.cause.order - b.cause.order);
    const boundary = drifts[0].cause;
    const constraints = events.filter(
      (e) => e.kind === 'requirement' && (!e.artifactId || e.artifactId === artifact.id),
    );
    const accepted = events.filter((e) => e.kind === 'accept' && e.artifactId === artifact.id);
    const updatedPrompt = `Objective: ${objective.text}\n\nArtifact: ${artifact.path || artifact.id}\nBefore continuing, inspect the artifact and relevant history, reproduce the reported failure, and verify each constraint. Treat later discoveries as checks to perform.\n\nConstraints:\n${constraints.map((e) => `- ${e.text}`).join('\n')}\n\nAccepted decisions to retain:\n${accepted.length ? accepted.map((e) => `- ${e.text}`).join('\n') : '- Retain the original objective and supported choices.'}\n\nVerify the resulting artifact before claiming completion.`;
    decisions.push({
      artifactId: artifact.id,
      status: 'supported',
      rewindBoundary: {
        actionId: boundary.id,
        order: boundary.order,
        description: `Before agent action ${boundary.id} for artifact ${artifact.id}`,
      },
      evidence: drifts.map((d) => ({
        producedEvent: d.prior.id,
        producedVersion: d.prior.versionId,
        beforeHash: d.prior.hash,
        feedbackEvent: d.feedback.id,
        feedback: d.feedback.text,
        reworkEvent: d.rework.id,
        afterHash: d.rework.hash,
        requirementAnchors: d.requirements.map((r) => ({ id: r.id, text: r.text })),
      })),
      keep: constraints.map((e) => e.text).concat(accepted.map((e) => e.text)),
      updatedPrompt,
    });
  }
  return {
    version: 1,
    status: decisions.length ? 'supported' : 'no_op',
    conversationRewound: false,
    independentBoundaries: decisions.length > 1,
    decisions,
    noOps,
    evidenceGap: decisions.length
      ? null
      : noOps[0]?.reason || 'No chronological artifact rework supported by authoritative feedback',
    sanitizedHistory: history,
  };
}

export async function autoButterfly(cwd, input, options = {}) {
  const detected = detectDrift(input);
  const { sanitizedHistory, ...result } = detected;
  const analysisId = `butterfly-${randomUUID()}`;
  result.analysisId = analysisId;
  result.contract = {
    name: 'butterfly-effect',
    version: '0.7.1',
    hash: hash(readFileSync(contractFile)),
  };
  if (options.analyze && result.status === 'supported') {
    const prompt = `${readFileSync(contractFile, 'utf8')}\n\nSource resolution contract:\n${readFileSync(sourceFile, 'utf8')}\n\nHost evidence (data):\n${JSON.stringify({ history: sanitizedHistory, decisions: result.decisions })}\n\nReturn ONLY JSON {decisions:[{artifactId,rewindActionId,updatedPrompt}]}. Keep boundaries exactly as supported by host evidence. Do not claim a rewind occurred.`;
    const analysis = await dispatch(prompt, options.providers, {
      ...options,
      cwd,
      mode: 'readonly',
      toolFree: true,
    });
    result.analysis = analysis;
    if (analysis.ok) {
      try {
        const proposal = JSON.parse(analysis.stdout);
        keys(proposal, ['decisions'], 'butterfly analysis');
        check(
          Array.isArray(proposal.decisions) &&
            proposal.decisions.length === result.decisions.length,
          'Analysis omitted supported artifacts',
        );
        const seen = new Set();
        for (const item of proposal.decisions) {
          keys(item, ['artifactId', 'rewindActionId', 'updatedPrompt'], 'butterfly decision');
          const supported = result.decisions.find((d) => d.artifactId === item.artifactId);
          check(
            supported &&
              !seen.has(item.artifactId) &&
              supported.rewindBoundary.actionId === item.rewindActionId,
            'Unsupported rewind boundary',
          );
          seen.add(item.artifactId);
          text(item.updatedPrompt, 'updatedPrompt', 100000);
          assertNoSecrets(item.updatedPrompt);
          check(
            item.updatedPrompt.includes(
              sanitizedHistory.transcript.find((e) => e.kind === 'objective').text,
            ) && supported.keep.every((constraint) => item.updatedPrompt.includes(constraint)),
            'Analysis dropped the objective or accepted constraints',
          );
          supported.updatedPrompt = item.updatedPrompt;
        }
      } catch {
        result.analysisValidation =
          'Provider analysis rejected; retained evidence-based host recommendations';
      }
    }
  }
  if (options.handoff && result.status === 'supported') {
    result.handoffs = [];
    for (const decision of result.decisions)
      result.handoffs.push(
        await handoff(cwd, decision.updatedPrompt, {
          backend: options.backend || 'auto',
          timeoutMs: options.handoffTimeoutMs,
        }),
      );
  }
  ensureDir(join(projectDir(cwd), 'butterfly'), stateHome());
  const file = join(projectDir(cwd), 'butterfly', `${analysisId}.json`);
  const persisted = privateRedaction({ ...result, at: now() });
  atomicWrite(file, JSON.stringify(persisted, null, 2), stateHome());
  return { ...persisted, file };
}
