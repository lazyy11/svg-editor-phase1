import { Shape } from './Shape.js';
import { Group } from './Group.js';
import { Validation } from './Validation.js';

export class SvgDocument {
  private readonly root = new Group('$canvas');
  private canvasWidth: number;
  private canvasHeight: number;

  constructor(width = 800, height = 600) {
    this.canvasWidth = Validation.positive(width, 'canvas width');
    this.canvasHeight = Validation.positive(height, 'canvas height');
  }
  get width(): number { return this.canvasWidth; }
  get height(): number { return this.canvasHeight; }
  get children(): readonly Shape[] { return this.root.children; }
  get shapes(): readonly Shape[] {
    const result: Shape[] = [];
    const visit = (shape: Shape): void => { result.push(shape); shape.children.forEach(visit); };
    this.children.forEach(visit);
    return result;
  }
  clone(): SvgDocument {
    const copy = new SvgDocument(this.width, this.height);
    this.children.forEach(child => copy.root.insert(child.clone()));
    return copy;
  }
  resize(width: number, height: number): void {
    Validation.positive(width, 'canvas width');
    Validation.positive(height, 'canvas height');
    this.canvasWidth = width;
    this.canvasHeight = height;
  }
  find(id: string): Shape {
    const found = this.shapes.find(shape => shape.id === id);
    if (!found) throw new Error(`no such shape: ${id}`);
    return found;
  }
  container(id?: string): Group {
    if (id === undefined) return this.root;
    const shape = this.shapes.find(shape => shape.id === id);
    if (!shape) throw new Error(`no such container: ${id}`);
    if (!(shape instanceof Group)) throw new Error(`not a container: ${id}`);
    return shape;
  }
  parentOf(shape: Shape): Group {
    const parent = [this.root, ...this.shapes.filter((node): node is Group => node instanceof Group)]
      .find(node => node.children.includes(shape));
    if (!parent) throw new Error(`no parent: ${shape.id}`);
    return parent;
  }
  parentLabel(shape: Shape): string {
    const parent = this.parentOf(shape);
    return parent === this.root ? 'svg' : parent.label;
  }
  ensureAvailable(id: string): void {
    Validation.id(id);
    if (this.shapes.some(shape => shape.id === id)) throw new Error(`id already exists: ${id}`);
  }
  add(shape: Shape, parentId?: string): void {
    const parent = this.container(parentId);
    const incoming: Shape[] = [];
    const visit = (node: Shape): void => { incoming.push(node); node.children.forEach(visit); };
    visit(shape);
    const ids = new Set<string>();
    for (const node of incoming) {
      this.ensureAvailable(node.id);
      if (ids.has(node.id)) throw new Error(`id already exists: ${node.id}`);
      ids.add(node.id);
    }
    parent.insert(shape);
  }
  delete(id: string): Shape {
    const shape = this.find(id);
    this.parentOf(shape).remove(shape);
    return shape;
  }
  private isAncestor(ancestor: Shape, descendant: Shape): boolean {
    return ancestor.children.some(child => child === descendant || this.isAncestor(child, descendant));
  }
  group(id: string, ids: readonly string[]): Group {
    this.ensureAvailable(id);
    if (new Set(ids).size !== ids.length) throw new Error('duplicate group member');
    const selected = ids.map(item => this.find(item));
    for (const shape of selected) {
      if (selected.some(other => other !== shape && this.isAncestor(shape, other))) {
        throw new Error(`cannot group a container into its own descendant: ${shape.id}`);
      }
    }
    // Preserve pre-edit document order, even when members have different parents.
    const ordered = this.shapes.filter(shape => selected.includes(shape));
    const first = ordered[0];
    if (!first) throw new Error('group requires at least one shape');
    const parent = this.parentOf(first);
    const position = parent.children.indexOf(first);
    const group = new Group(id);
    for (const shape of ordered) { this.parentOf(shape).remove(shape); group.insert(shape); }
    parent.insert(group, position);
    return group;
  }
  ungroup(id: string): number {
    const group = this.container(id);
    const parent = this.parentOf(group);
    if (parent === this.root) throw new Error(`cannot ungroup top-level container: ${id}`);
    const index = parent.children.indexOf(group);
    const children = group.children;
    parent.remove(group);
    children.forEach((child, offset) => { group.remove(child); parent.insert(child, index + offset); });
    return children.length;
  }
  addTo(groupId: string, id: string): void {
    const target = this.container(groupId);
    const shape = this.find(id);
    if (target === shape || this.isAncestor(shape, target)) {
      throw new Error(`cannot group a container into its own descendant: ${id}`);
    }
    this.parentOf(shape).remove(shape);
    target.insert(shape);
  }
  reorder(id: string, front: boolean): void {
    const shape = this.find(id);
    const parent = this.parentOf(shape);
    parent.remove(shape);
    parent.insert(shape, front ? parent.children.length : 0);
  }
}
