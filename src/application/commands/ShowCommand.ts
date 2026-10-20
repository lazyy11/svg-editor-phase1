import type { Command } from '../Command.js';
import type { Editor } from '../Editor.js';
import { TreeFormatter } from '../TreeFormatter.js';
export class ShowCommand implements Command {
  constructor(private readonly id: string) {}
  async execute(editor: Editor): Promise<readonly string[]> { return [new TreeFormatter().show(editor.document, this.id)]; }
}
