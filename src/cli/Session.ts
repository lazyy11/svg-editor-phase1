import type { Editor } from '../application/Editor.js';
import { Tokenizer } from './Tokenizer.js';
import { CommandRegistry } from './CommandRegistry.js';

export class Session {
  private readonly tokenizer = new Tokenizer();
  private readonly registry = new CommandRegistry();
  constructor(private readonly editor: Editor) {}
  async execute(line: string): Promise<readonly string[]> {
    try {
      const command = this.registry.parse(this.tokenizer.tokenize(line));
      return command ? await command.execute(this.editor) : [];
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return [`error: ${message.replace(/[\r\n\x00-\x1f\x7f]+/g, ' ')}`];
    }
  }
}
