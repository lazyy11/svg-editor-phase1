import type { Command } from '../Command.js';
import type { Editor } from '../Editor.js';
export class RedoCommand implements Command {
  async execute(editor: Editor): Promise<readonly string[]> { return [editor.redo()]; }
}
