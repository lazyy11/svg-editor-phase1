import type { Editor } from './Editor.js';

export interface Command {
  execute(editor: Editor): Promise<readonly string[]>;
}
