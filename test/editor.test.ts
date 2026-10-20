import test from 'node:test';
import assert from 'node:assert/strict';
import { EditorHarness } from './EditorHarness.js';

test('help works before init and all document-dependent commands reject', async () => {
  const h = new EditorHarness();
  assert.match((await h.session.execute('help')).join('\n'), /ungroup/);
  for (const command of ['tree', 'show x', 'create g x', 'save x.svg', 'undo', 'redo', 'canvas']) {
    assert.deepEqual(await h.session.execute(command), ["error: no document. use 'init' or 'read' first"]);
  }
});

for (const [type, args, expected] of [
  ['rect', '1 2 3 4', { x: 1, y: 2, width: 3, height: 4 }],
  ['circle', '1 2 3', { cx: 1, cy: 2, r: 3 }],
  ['ellipse', '1 2 3 4', { cx: 1, cy: 2, rx: 3, ry: 4 }],
  ['line', '1 2 3 4', { x1: 1, y1: 2, x2: 3, y2: 4 }],
  ['text', '1 2 "中文 text"', { x: 1, y: 2 }],
  ['g', '', {}],
] as const) {
  test(`${type}: creation, polymorphic move/scale, undo/redo and absent default paint`, async () => {
    const h = new EditorHarness();
    await h.run('init', `create ${type} item ${args}`);
    assert.deepEqual(h.editor.document.find('item').numericAttributes, expected);
    assert.equal(h.editor.document.find('item').attributes.fill, undefined);
    assert.equal(h.editor.document.find('item').attributes.stroke, undefined);
    const original = h.snapshot();
    await h.run('move item 5 -2', 'scale item .5', 'undo', 'undo');
    assert.equal(h.snapshot(), original);
    await h.run('redo', 'redo');
    if (type === 'rect') assert.deepEqual(h.editor.document.find('item').numericAttributes, { x: 3, y: 0, width: 1.5, height: 2 });
    await h.run('delete item');
    assert.equal(h.editor.document.shapes.length, 0);
    await h.run('undo');
    assert.equal(h.editor.document.shapes.length, 1);
  });
}

test('id matching is case-sensitive and unique over nested groups', async () => {
  const h = new EditorHarness();
  await h.run('init', 'create g g', 'create rect r 0 0 10 20 in g', 'create g R');
  await h.error('create circle r 0 0 1', 'id already exists: r');
  await h.error('move missing 1 2', 'no such shape: missing');
});

test('all six types support create in; missing/non-container parents are atomic', async () => {
  const h = new EditorHarness();
  await h.run('init', 'create g scene', 'create g node in scene', 'create rect r 0 0 1 1 in node',
    'create circle c 0 0 1 in node', 'create ellipse e 0 0 1 2 in node', 'create line l 0 0 1 1 in node', 'create text t 0 0 "in" in node');
  assert.equal(h.editor.document.find('node').children.length, 5);
  await h.error('create g bad in missing', 'no such container: missing');
  await h.error('create g bad in r', 'not a container: r');
});

test('nested Composite moves and scales each leaf exactly once; group style is inherited SVG', async () => {
  const h = new EditorHarness();
  await h.run('init', 'create g root', 'create g nested in root', 'create rect r 10 20 30 40 in nested', 'create text t 3 4 "label" in root',
    'move root 2 3', 'scale root 2', 'set root fill red');
  assert.deepEqual(h.editor.document.find('r').numericAttributes, { x: 24, y: 46, width: 60, height: 80 });
  assert.deepEqual(h.editor.document.find('t').numericAttributes, { x: 10, y: 14 });
  assert.equal(h.editor.document.find('root').attributes.fill, 'red');
  assert.equal(h.editor.document.find('r').attributes.fill, undefined);
});

test('group preserves document order and placement across original parents; one undo restores all', async () => {
  const h = new EditorHarness();
  await h.run('init', 'create g scene', 'create g other', 'create rect a 0 0 1 1 in scene', 'create circle b 0 0 1 in other', 'create g tail in scene');
  const before = h.snapshot();
  await h.run('group pack b a');
  assert.deepEqual(h.editor.document.find('pack').children.map(shape => shape.id), ['a', 'b']);
  assert.deepEqual(h.editor.document.find('scene').children.map(shape => shape.id), ['pack', 'tail']);
  await h.run('undo');
  assert.equal(h.snapshot(), before);
  await h.run('redo');
  assert.deepEqual(h.editor.document.find('other').children, []);
});

test('group rejects ancestor/descendant selections in either order, duplicates and missing ids', async () => {
  const h = new EditorHarness();
  await h.run('init', 'create g g1', 'create g g2 in g1');
  await h.error('group bad g1 g2', 'cannot group a container into its own descendant: g1');
  await h.error('group bad g2 g1', 'cannot group a container into its own descendant: g1');
  await h.error('group bad g2 g2', 'duplicate group member');
  await h.error('group bad g2 absent', 'no such shape: absent');
});

test('ungroup promotes children at the group position, undo restores subtree, top-level is rejected', async () => {
  const h = new EditorHarness();
  await h.run('init', 'create g scene', 'create g before in scene', 'create g nested in scene', 'create g a in nested', 'create g b in nested', 'create g after in scene');
  const before = h.snapshot();
  await h.run('ungroup nested');
  assert.deepEqual(h.editor.document.find('scene').children.map(shape => shape.id), ['before', 'a', 'b', 'after']);
  await h.run('undo');
  assert.equal(h.snapshot(), before);
  await h.error('ungroup scene', 'cannot ungroup top-level container: scene');
});

test('addto appends, accepts an existing child, and rejects self/ancestor cycles', async () => {
  const h = new EditorHarness();
  await h.run('init', 'create g scene', 'create g inner in scene', 'create g a', 'create g b in inner', 'addto inner a');
  assert.deepEqual(h.editor.document.find('inner').children.map(shape => shape.id), ['b', 'a']);
  await h.run('addto inner b');
  assert.deepEqual(h.editor.document.find('inner').children.map(shape => shape.id), ['a', 'b']);
  await h.error('addto inner scene', 'cannot group a container into its own descendant: scene');
  await h.error('addto scene scene', 'cannot group a container into its own descendant: scene');
});

test('front/back affect only siblings; delete subtree and one undo restores exact z-order', async () => {
  const h = new EditorHarness();
  await h.run('init', 'create g scene', 'create g a in scene', 'create g b in scene', 'create g c in scene', 'front a');
  assert.deepEqual(h.editor.document.find('scene').children.map(shape => shape.id), ['b', 'c', 'a']);
  await h.run('back a');
  assert.deepEqual(h.editor.document.find('scene').children.map(shape => shape.id), ['a', 'b', 'c']);
  const before = h.snapshot();
  await h.run('delete scene');
  assert.equal(h.editor.document.shapes.length, 0);
  await h.run('undo');
  assert.equal(h.snapshot(), before);
});

test('new successful edit clears redo; failed edit and queries preserve redo', async () => {
  const h = new EditorHarness();
  await h.run('init', 'create g a', 'create g b', 'undo', 'tree', 'show a', 'canvas', 'help');
  await h.error('set a id changed', 'unknown attribute: id');
  await h.run('redo', 'undo', 'create g c');
  await h.error('redo', 'nothing to redo');
});

for (const io of ['init', 'canvas 900 700', 'save saved.svg', 'read imported.svg']) {
  test(`${io}: blocks undo/redo, editing re-enables only new history`, async () => {
    const h = new EditorHarness();
    h.store.files.set('imported.svg', '<svg width="20" height="30"/>');
    await h.run('init', 'create g old', io);
    await h.error('undo', 'undo not allowed after io command');
    await h.error('redo', 'undo not allowed after io command');
    await h.run('create g new', 'undo');
    await h.error('undo', 'nothing to undo');
  });
}

test('failed read/save/init/canvas preserve document, current path, and history', async () => {
  const h = new EditorHarness();
  await h.run('init', 'save first.svg', 'create g a');
  h.store.failWrites = true;
  await h.error('save broken.svg', 'cannot write file: broken.svg');
  await h.error('read absent.svg', 'cannot read file: absent.svg');
  await h.error('init -2 3', 'canvas width must be positive');
  await h.error('canvas 20 -1', 'canvas height must be positive');
  await h.run('undo', 'redo');
  h.store.failWrites = false;
  await h.run('save');
  assert.match(h.store.files.get('first.svg')!, /id="a"/);
  assert.equal(h.store.files.has('broken.svg'), false);
});

for (const [command, error] of [
  ['scale r 0', 'scale factor must be positive'], ['scale r -2', 'scale factor must be positive'],
  ['scale r NaN', 'invalid scale factor: NaN'], ['move r Infinity 0', 'invalid number: Infinity'],
  ['set r width -1', 'width must be nonnegative'], ['set r x 1e999', 'invalid x: 1e999'],
  ['set r onclick alert', 'unknown attribute: onclick'], ['set r text hello', 'unknown attribute: text'],
  ['set r stroke-width -1', 'stroke-width must be nonnegative'],
  ['set r fill "url(https://example.com/payload)"', 'unsupported paint value'],
  ['create hexagon h', 'unknown shape type: hexagon (is the plugin loaded?)'],
  ['create box h', 'unknown shape type: box (is the plugin loaded?)'],
] as const) {
  test(`atomic validation: ${command}`, async () => {
    const h = new EditorHarness();
    await h.run('init', 'create rect r 1 2 3 4');
    await h.error(command, error);
    await h.run('undo');
    assert.equal(h.editor.document.shapes.length, 0, 'failure added a history entry');
  });
}

test('overflow halfway through recursive group edit rolls back every child', async () => {
  const h = new EditorHarness();
  await h.run('init', 'create g scene', 'create rect first 1 2 3 4 in scene', 'create rect huge 1e308 2 3 4 in scene');
  await h.error('scale scene 10', 'invalid number: Infinity');
  await h.run('undo');
  assert.equal(h.editor.document.shapes.length, 2);
});

test('double quotes, empty text, escaped quotes, spaces in paths, comments and color hashes', async () => {
  const h = new EditorHarness();
  await h.run('# comment', '', 'init', 'create text t 1 2 "hello \\"quoted\\" world"'.replaceAll('\\\\', '\\'));
  assert.equal(h.editor.document.find('t').text, 'hello "quoted" world');
  await h.run('set t text ""', 'create rect r .5 -2 0 0 #eee', 'save "path with spaces.svg"');
  assert.equal(h.editor.document.find('t').text, '');
  assert.ok(h.store.files.has('path with spaces.svg'));
  await h.error('set t text "unfinished', 'unterminated double quote');
});

test('tree/show contain geometry and parent, and query snapshots cannot change live state', async () => {
  const h = new EditorHarness();
  await h.run('init', 'create g g', 'create circle c 10 20 3 red in g');
  assert.match((await h.session.execute('tree')).join('\n'), /circle#c.*cx=10 cy=20 r=3.*fill=red/);
  assert.match((await h.session.execute('show c')).join('\n'), /parent=g#g/);
  assert.equal((await h.session.execute('tree c'))[0], 'circle#c  cx=10 cy=20 r=3  fill=red');
  h.editor.document.find('c').move(100, 100);
  assert.equal(h.editor.document.find('c').numericAttributes.cx, 10);
});
