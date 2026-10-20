import { EditCommand } from '../EditCommand.js';
import type { SvgDocument } from '../../domain/SvgDocument.js';
export class UngroupCommand extends EditCommand {
  constructor(private readonly id: string) { super(); }
  apply(document: SvgDocument): string { return `g#${this.id} ungrouped (${document.ungroup(this.id)} children promoted)`; }
}
