import { Shape } from './Shape.js';

export class Line extends Shape {
  readonly tag = 'line';
  constructor(id: string) { super(id, { x1: 0, y1: 0, x2: 0, y2: 0 }, ['x1', 'x2'], ['y1', 'y2']); }
  override get creationPaint(): string { return 'stroke'; }
  protected recreate(): Line { return new Line(this.id); }
}
