import type { Command } from '../Command.js';
import type { Editor } from '../Editor.js';
import { TreeFormatter } from '../TreeFormatter.js';
export class TreeCommand implements Command {
  constructor(private readonly id?: string) {}
  async execute(editor: Editor): Promise<readonly string[]> { return [new TreeFormatter().tree(editor.document, this.id)]; }
}
