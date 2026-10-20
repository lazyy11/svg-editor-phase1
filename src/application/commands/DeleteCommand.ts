import { EditCommand } from '../EditCommand.js';
import type { SvgDocument } from '../../domain/SvgDocument.js';
export class DeleteCommand extends EditCommand {
  constructor(private readonly id: string) { super(); }
  apply(document: SvgDocument): string { return `${document.delete(this.id).label} deleted`; }
}
