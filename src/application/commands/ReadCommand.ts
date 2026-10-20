import type { Command } from '../Command.js';
import type { Editor } from '../Editor.js';
export class ReadCommand implements Command {
  constructor(private readonly path: string) {}
  async execute(editor: Editor): Promise<readonly string[]> { return editor.read(this.path); }
}
