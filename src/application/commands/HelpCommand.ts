import type { Command } from '../Command.js';
export class HelpCommand implements Command {
  constructor(private readonly usage: string) {}
  async execute(): Promise<readonly string[]> { return [this.usage]; }
}
