import assert from 'node:assert/strict';
import { Editor } from '../src/application/Editor.js';
import { Session } from '../src/cli/Session.js';
import { SvgCodec } from '../src/infrastructure/SvgCodec.js';
import { MemoryStore } from './MemoryStore.js';

export class EditorHarness {
  readonly store = new MemoryStore();
  readonly editor = new Editor(this.store);
  readonly session = new Session(this.editor);
  async run(...lines: string[]): Promise<void> {
    for (const line of lines) {
      const result = await this.session.execute(line);
      assert.ok(!result.some(message => message.startsWith('error:')), `${line}: ${result.join('\n')}`);
    }
  }
  snapshot(): string { return new SvgCodec().encode(this.editor.document); }
  async error(line: string, message: string): Promise<void> {
    const before = this.snapshot();
    assert.deepEqual(await this.session.execute(line), [`error: ${message}`]);
    assert.equal(this.snapshot(), before, `failed command changed document: ${line}`);
  }
}
