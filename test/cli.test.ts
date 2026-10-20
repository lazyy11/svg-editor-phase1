import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { SvgCodec } from '../src/infrastructure/SvgCodec.js';

test('real executable: stdin, Chinese text, saving and reading an SVG path containing spaces', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'svg-cli-'));
  try {
    const svg = join(directory, 'my diagram.svg');
    const result = spawnSync(process.execPath, ['dist/src/main.js'], {
      input: ['init 400 200', 'create g scene', 'create rect r 10 20 30 40 red in scene', 'create text t 10 40 "中文流程图" in scene',
        `save "${svg}"`, `read "${svg}"`, 'tree', 'move scene 5 5', 'undo', 'redo', 'show r'].join('\n'),
      encoding: 'utf8', timeout: 10000,
    });
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.match(result.stdout, /svg>/);
    assert.match(result.stdout, /parent=g#scene/);
    assert.match(result.stdout, /x=15 y=25 width=30 height=40/);
    const document = new SvgCodec().decode(await readFile(svg, 'utf8')).document;
    assert.equal(document.find('t').text, '中文流程图');
    assert.equal(document.shapes.length, 3);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('real executable: errors have one-line prefix, continue processing, batch reports failure', () => {
  const result = spawnSync(process.execPath, ['dist/src/main.js'], {
    input: 'tree\ninit\ncreate rect r 1 2 3 4\nmove absent 1 2\nshow r\n', encoding: 'utf8', timeout: 10000,
  });
  assert.equal(result.status, 1);
  assert.match(result.stdout, /error: no document/);
  assert.match(result.stdout, /error: no such shape: absent/);
  assert.match(result.stdout, /rect#r  parent=svg/);
  assert.equal(result.stderr, '');
});

test('real script entrypoint and failed read/write do not corrupt history or existing files', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'svg-script-'));
  try {
    const path = join(directory, 'commands.txt');
    const saved = join(directory, 'saved.svg');
    await writeFile(path, `init\ncreate g scene\nsave "${saved}"\ncreate g edit\nread "${directory}/missing.svg"\nundo\ntree\n`, 'utf8');
    const result = spawnSync(process.execPath, [resolve('dist/src/main.js'), '--script', path], { encoding: 'utf8', timeout: 10000 });
    assert.equal(result.status, 1);
    assert.match(result.stdout, /cannot read file:/);
    assert.match(result.stdout, /undone:/);
    const loaded = new SvgCodec().decode(await readFile(saved, 'utf8'));
    assert.deepEqual(loaded.document.shapes.map(shape => shape.id), ['scene']);
    const failedWrite = spawnSync(process.execPath, [resolve('dist/src/main.js')], {
      input: `init\ncreate g scene\nsave "${directory}/absent/fail.svg"\nundo\ntree\n`, encoding: 'utf8', timeout: 10000,
    });
    assert.equal(failedWrite.status, 1);
    assert.match(failedWrite.stdout, /cannot write file:/);
    assert.match(failedWrite.stdout, /undone:/);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('missing script and invalid executable arguments terminate cleanly', () => {
  for (const args of [['--script', 'not-a-real-script.txt'], ['--unknown']]) {
    const result = spawnSync(process.execPath, ['dist/src/main.js', ...args], { encoding: 'utf8', timeout: 10000 });
    assert.equal(result.status, 1);
    assert.match(result.stdout, /error:/);
    assert.equal(result.stderr, '');
  }
});
