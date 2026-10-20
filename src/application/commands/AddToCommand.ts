import { EditCommand } from '../EditCommand.js';
import type { SvgDocument } from '../../domain/SvgDocument.js';
export class AddToCommand extends EditCommand {
  constructor(private readonly group: string, private readonly id: string) { super(); }
  apply(document: SvgDocument): string {
    document.addTo(this.group, this.id);
    return `${document.find(this.id).label} moved into g#${this.group}`;
  }
}
