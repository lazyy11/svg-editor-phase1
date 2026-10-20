import type { Command } from '../application/Command.js';
import type { Token } from './Token.js';
import { CommandArguments as Validation } from '../application/CommandArguments.js';
import { CreateCommand } from '../application/commands/CreateCommand.js';
import { DeleteCommand } from '../application/commands/DeleteCommand.js';
import { MoveCommand } from '../application/commands/MoveCommand.js';
import { ScaleCommand } from '../application/commands/ScaleCommand.js';
import { SetCommand } from '../application/commands/SetCommand.js';
import { GroupCommand } from '../application/commands/GroupCommand.js';
import { UngroupCommand } from '../application/commands/UngroupCommand.js';
import { AddToCommand } from '../application/commands/AddToCommand.js';
import { FrontCommand } from '../application/commands/FrontCommand.js';
import { BackCommand } from '../application/commands/BackCommand.js';
import { InitCommand } from '../application/commands/InitCommand.js';
import { ReadCommand } from '../application/commands/ReadCommand.js';
import { SaveCommand } from '../application/commands/SaveCommand.js';
import { CanvasCommand } from '../application/commands/CanvasCommand.js';
import { TreeCommand } from '../application/commands/TreeCommand.js';
import { ShowCommand } from '../application/commands/ShowCommand.js';
import { UndoCommand } from '../application/commands/UndoCommand.js';
import { RedoCommand } from '../application/commands/RedoCommand.js';
import { HelpCommand } from '../application/commands/HelpCommand.js';

export class CommandRegistry {
  // Phase 1 name dispatch #2; future command-provider registration boundary.
  private readonly commands = new Map<string, { syntax: string; parse: (args: readonly Token[]) => Command }>();

  constructor() {
    this.register('init', 'init [w] [h]', 0, 2, a => {
      return new InitCommand(a[0] ? Validation.number(a[0]) : 800, a[1] ? Validation.number(a[1]) : 600);
    });
    this.register('read', 'read <file.svg>', 1, 1, a => new ReadCommand(a[0]!));
    this.register('save', 'save [file.svg]', 0, 1, a => new SaveCommand(a[0]));
    this.register('canvas', 'canvas [w h]', 0, 2, a => {
      if (a.length === 1) throw new Error('usage: canvas [w h]');
      return new CanvasCommand(a[0] === undefined ? undefined : Validation.number(a[0]), a[1] === undefined ? undefined : Validation.number(a[1]));
    });
    this.commands.set('create', { syntax: 'create <rect|circle|ellipse|line|text|g> <id> [params...] [in <containerId>]', parse: tokens => {
      if (tokens.length < 2) throw new Error('usage: create <type> <id> [params...] [in <containerId>]');
      let parameters = tokens.slice(2);
      let parent: string | undefined;
      const marker = parameters.at(-2);
      if (marker?.value === 'in' && !marker.quoted) {
        parent = parameters.at(-1)!.value;
        parameters = parameters.slice(0, -2);
      }
      return new CreateCommand(tokens[0]!.value, tokens[1]!.value, parameters.map(token => token.value), parent);
    } });
    this.register('delete', 'delete <id>', 1, 1, a => new DeleteCommand(a[0]!));
    this.register('move', 'move <id> <dx> <dy>', 3, 3, a => new MoveCommand(a[0]!, Validation.number(a[1]!), Validation.number(a[2]!)));
    this.register('scale', 'scale <id> <factor>', 2, 2, a => new ScaleCommand(a[0]!, Validation.positive(a[1]!, 'scale factor')));
    this.register('set', 'set <id> <attr> <value>', 3, 3, a => new SetCommand(a[0]!, a[1]!, a[2]!));
    this.register('group', 'group <newGid> <id1> [id2...]', 2, Infinity, a => new GroupCommand(a[0]!, a.slice(1)));
    this.register('ungroup', 'ungroup <gid>', 1, 1, a => new UngroupCommand(a[0]!));
    this.register('addto', 'addto <gid> <id>', 2, 2, a => new AddToCommand(a[0]!, a[1]!));
    this.register('front', 'front <id>', 1, 1, a => new FrontCommand(a[0]!));
    this.register('back', 'back <id>', 1, 1, a => new BackCommand(a[0]!));
    this.register('tree', 'tree [id]', 0, 1, a => new TreeCommand(a[0]));
    this.register('show', 'show <id>', 1, 1, a => new ShowCommand(a[0]!));
    this.register('undo', 'undo', 0, 0, () => new UndoCommand());
    this.register('redo', 'redo', 0, 0, () => new RedoCommand());
    this.register('help', 'help', 0, 0, () => new HelpCommand(this.help()));
  }
  private register(name: string, syntax: string, minimum: number, maximum: number, create: (values: readonly string[]) => Command): void {
    this.commands.set(name, { syntax, parse: tokens => {
      if (tokens.length < minimum || tokens.length > maximum) throw new Error(`usage: ${syntax}`);
      return create(tokens.map(token => token.value));
    } });
  }
  parse(tokens: readonly Token[]): Command | undefined {
    const name = tokens[0]?.value;
    if (name === undefined) return undefined;
    const entry = this.commands.get(name);
    if (!entry) throw new Error(`unknown command: ${name}`);
    return entry.parse(tokens.slice(1));
  }
  help(): string {
    return [...this.commands.values()].map(entry => entry.syntax).join('\n') +
      '\nShapes: rect x y w h [fill]; circle cx cy r [fill]; ellipse cx cy rx ry [fill]; line x1 y1 x2 y2 [stroke]; text x y "content"; g' +
      '\nset: fill | stroke | stroke-width | shape geometry | text content (text only)' +
      '\n# starts a comment line; use double quotes for spaces; EOF (Ctrl+D / Ctrl+Z then Enter) exits.';
  }
}
