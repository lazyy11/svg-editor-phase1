import { Shape } from './Shape.js';

export class Ellipse extends Shape {
  readonly tag = 'ellipse';
  constructor(id: string) { super(id, { cx: 0, cy: 0, rx: 0, ry: 0 }, ['cx'], ['cy'], ['rx', 'ry']); }
  protected recreate(): Ellipse { return new Ellipse(this.id); }
}
