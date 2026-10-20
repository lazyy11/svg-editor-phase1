import type { Command } from '../Command.js';
import type { Editor } from '../Editor.js';
export class SaveCommand implements Command {
  constructor(private readonly path?: string) {}
  async execute(editor: Editor): Promise<readonly string[]> { return [await editor.save(this.path)]; }
}
