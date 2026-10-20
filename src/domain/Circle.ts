import { Shape } from './Shape.js';

export class Circle extends Shape {
  readonly tag = 'circle';
  constructor(id: string) { super(id, { cx: 0, cy: 0, r: 0 }, ['cx'], ['cy'], ['r']); }
  protected recreate(): Circle { return new Circle(this.id); }
}
