import { Shape } from './Shape.js';

export class Rect extends Shape {
  readonly tag = 'rect';
  constructor(id: string) { super(id, { x: 0, y: 0, width: 0, height: 0 }, ['x'], ['y'], ['width', 'height']); }
  protected recreate(): Rect { return new Rect(this.id); }
}
