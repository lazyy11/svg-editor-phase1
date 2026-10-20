import { Shape } from './Shape.js';

export class Group extends Shape {
  readonly tag = 'g';
  private nodes: Shape[] = [];
  constructor(id: string) { super(id, {}, [], []); }
  override get children(): readonly Shape[] { return [...this.nodes]; }
  override get isContainer(): boolean { return true; }
  override get creationPaint(): undefined { return undefined; }
  protected recreate(): Group {
    const copy = new Group(this.id);
    for (const child of this.nodes) copy.insert(child.clone());
    return copy;
  }
  insert(shape: Shape, index = this.nodes.length): void {
    if (shape === this || this.contains(shape, this)) throw new Error('cannot create a containment cycle');
    this.nodes.splice(index, 0, shape);
  }
  remove(shape: Shape): void {
    const index = this.nodes.indexOf(shape);
    if (index < 0) throw new Error(`no such child: ${shape.id}`);
    this.nodes.splice(index, 1);
  }
  private contains(root: Shape, target: Shape): boolean {
    return root.children.some(child => child === target || this.contains(child, target));
  }
  override move(dx: number, dy: number): void {
    for (const child of this.nodes) child.move(dx, dy);
  }
  override scale(factor: number): void {
    super.scale(factor);
    for (const child of this.nodes) child.scale(factor);
  }
}
