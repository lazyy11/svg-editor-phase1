import { createInterface } from 'node:readline';
import type { Readable, Writable } from 'node:stream';
import type { Session } from './Session.js';

export class Repl {
  constructor(private readonly session: Session) {}
  async run(input: Readable, output: Writable): Promise<boolean> {
    output.write("svg-editor 0.1 — type 'help' for commands\nsvg> ");
    const lines = createInterface({ input, crlfDelay: Infinity, terminal: false });
    let success = true;
    for await (const line of lines) {
      const messages = await this.session.execute(line);
      for (const message of messages) {
        if (message.startsWith('error:')) success = false;
        output.write(message + '\n');
      }
      output.write('svg> ');
    }
    output.write('\n');
    return success;
  }
}
