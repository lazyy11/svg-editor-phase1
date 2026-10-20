import type { Command } from '../Command.js';
import type { Editor } from '../Editor.js';
export class CanvasCommand implements Command {
  constructor(private readonly width?: number, private readonly height?: number) {}
  async execute(editor: Editor): Promise<readonly string[]> { return [editor.canvas(this.width, this.height)]; }
}
