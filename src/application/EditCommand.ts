import type { Command } from './Command.js';
import type { Editor } from './Editor.js';
import type { SvgDocument } from '../domain/SvgDocument.js';

export abstract class EditCommand implements Command {
  private before: SvgDocument | undefined;
  private after: SvgDocument | undefined;
  abstract apply(document: SvgDocument): string;
  async execute(editor: Editor): Promise<readonly string[]> { return [editor.edit(this)]; }
  remember(before: SvgDocument, after: SvgDocument): void {
    this.before = before;
    this.after = after.clone();
  }
  undo(): SvgDocument {
    if (!this.before) throw new Error('command has not executed');
    return this.before.clone();
  }
  redo(): SvgDocument {
    if (!this.after) throw new Error('command has not executed');
    return this.after.clone();
  }
}
