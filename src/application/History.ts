import type { EditCommand } from './EditCommand.js';
import type { SvgDocument } from '../domain/SvgDocument.js';

export class History {
  private past: EditCommand[] = [];
  private future: EditCommand[] = [];
  private ioBarrier = false;

  record(command: EditCommand): void { this.past.push(command); this.future = []; this.ioBarrier = false; }
  blockAfterIO(): void { this.past = []; this.future = []; this.ioBarrier = true; }
  undo(): SvgDocument {
    if (this.ioBarrier) throw new Error('undo not allowed after io command');
    const command = this.past.at(-1);
    if (!command) throw new Error('nothing to undo');
    const document = command.undo();
    this.past.pop();
    this.future.push(command);
    return document;
  }
  redo(): SvgDocument {
    if (this.ioBarrier) throw new Error('undo not allowed after io command');
    const command = this.future.at(-1);
    if (!command) throw new Error('nothing to redo');
    const document = command.redo();
    this.future.pop();
    this.past.push(command);
    return document;
  }
}
