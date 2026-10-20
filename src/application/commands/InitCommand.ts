import type { Command } from '../Command.js';
import type { Editor } from '../Editor.js';
export class InitCommand implements Command {
  constructor(private readonly width = 800, private readonly height = 600) {}
  async execute(editor: Editor): Promise<readonly string[]> { return [editor.init(this.width, this.height)]; }
}
