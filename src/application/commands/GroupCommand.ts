import { EditCommand } from '../EditCommand.js';
import type { SvgDocument } from '../../domain/SvgDocument.js';
export class GroupCommand extends EditCommand {
  constructor(private readonly id: string, private readonly members: readonly string[]) { super(); }
  apply(document: SvgDocument): string {
    const shape = document.group(this.id, this.members);
    return `${shape.label} created with ${shape.children.length} children`;
  }
}
