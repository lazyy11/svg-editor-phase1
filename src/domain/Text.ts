import { Shape } from './Shape.js';

export class Text extends Shape {
  readonly tag = 'text';
  private content = '';
  constructor(id: string) { super(id, { x: 0, y: 0 }, ['x'], ['y']); }
  override get text(): string { return this.content; }
  override get creationFields(): readonly string[] { return [...super.creationFields, 'text']; }
  override get creationPaint(): undefined { return undefined; }
  protected recreate(): Text {
    const copy = new Text(this.id);
    copy.content = this.content;
    return copy;
  }
  override set(attribute: string, value: string): void {
    if (attribute === 'text') { this.content = value; return; }
    super.set(attribute, value);
  }
  override summary(): string { return `${super.summary()}  ${JSON.stringify(this.content)}`; }
}
