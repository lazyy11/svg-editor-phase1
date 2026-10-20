import { EditCommand } from '../EditCommand.js';
import { ShapeFactory } from '../../domain/ShapeFactory.js';
import type { SvgDocument } from '../../domain/SvgDocument.js';

export class CreateCommand extends EditCommand {
  constructor(private readonly type: string, private readonly id: string, private readonly values: readonly string[], private readonly parent?: string) { super(); }
  apply(document: SvgDocument): string {
    document.ensureAvailable(this.id);
    const shape = new ShapeFactory().create(this.type, this.id, this.values);
    document.add(shape, this.parent);
    return `${shape.label} created${this.parent === undefined ? '' : ` in g#${this.parent}`}`;
  }
}
