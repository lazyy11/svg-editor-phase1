import { Shape } from './Shape.js';
import { Rect } from './Rect.js';
import { Circle } from './Circle.js';
import { Ellipse } from './Ellipse.js';
import { Line } from './Line.js';
import { Text } from './Text.js';
import { Group } from './Group.js';

export class ShapeFactory {
  // Phase 1 name dispatch #1; future ShapeProvider registration boundary.
  private readonly constructors = new Map<string, (id: string) => Shape>([
    ['rect', id => new Rect(id)], ['circle', id => new Circle(id)],
    ['ellipse', id => new Ellipse(id)], ['line', id => new Line(id)],
    ['text', id => new Text(id)], ['g', id => new Group(id)],
  ]);

  empty(type: string, id: string): Shape {
    const create = this.constructors.get(type);
    if (!create) throw new Error(`unknown shape type: ${type} (is the plugin loaded?)`);
    return create(id);
  }

  create(type: string, id: string, values: readonly string[]): Shape {
    const shape = this.empty(type, id);
    const fields = shape.creationFields;
    if (values.length < fields.length || values.length > fields.length + (shape.creationPaint ? 1 : 0)) {
      throw new Error(`invalid parameters for ${type}: expected ${fields.join(' ') || 'no parameters'}`);
    }
    fields.forEach((field, index) => shape.set(field, values[index]!));
    if (values.length > fields.length) shape.set(shape.creationPaint!, values[fields.length]!);
    return shape;
  }
}
