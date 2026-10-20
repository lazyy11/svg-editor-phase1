import { Validation } from './Validation.js';

export abstract class Shape {
  abstract readonly tag: string;
  private readonly identity: string;
  private geometry: Record<string, number>;
  private styles: Record<string, string> = {};

  protected constructor(
    id: string,
    geometry: Record<string, number>,
    private readonly xKeys: readonly string[],
    private readonly yKeys: readonly string[],
    private readonly nonnegativeKeys: readonly string[] = [],
  ) {
    Validation.id(id);
    this.identity = id;
    this.geometry = { ...geometry };
    for (const [key, value] of Object.entries(geometry)) this.validateGeometry(key, value);
  }

  get id(): string { return this.identity; }
  get label(): string { return `${this.tag}#${this.id}`; }
  get children(): readonly Shape[] { return []; }
  get text(): string | undefined { return undefined; }
  get isContainer(): boolean { return false; }
  get creationFields(): readonly string[] { return Object.keys(this.geometry); }
  get creationPaint(): string | undefined { return 'fill'; }
  get numericAttributes(): Readonly<Record<string, number>> { return { ...this.geometry }; }
  get attributes(): Readonly<Record<string, string>> {
    return Object.fromEntries([
      ...Object.entries(this.geometry).map(([key, value]) => [key, String(value)]),
      ...Object.entries(this.styles),
    ]);
  }

  protected abstract recreate(): Shape;

  clone(): Shape {
    const copy = this.recreate();
    copy.geometry = { ...this.geometry };
    copy.styles = { ...this.styles };
    return copy;
  }

  private validateGeometry(key: string, value: number): void {
    Validation.number(value, key);
    if (this.nonnegativeKeys.includes(key) && value < 0) throw new Error(`${key} must be nonnegative`);
  }

  set(attribute: string, value: string): void {
    if (Object.hasOwn(this.geometry, attribute)) {
      const number = Validation.number(value, attribute);
      this.validateGeometry(attribute, number);
      this.geometry[attribute] = number;
      return;
    }
    if (['fill', 'stroke', 'stroke-width'].includes(attribute)) {
      if (attribute === 'stroke-width') {
        const number = Validation.number(value, attribute);
        if (number < 0) throw new Error('stroke-width must be nonnegative');
        value = String(number);
      } else Validation.paint(value);
      this.styles[attribute] = value;
      return;
    }
    throw new Error(`unknown attribute: ${attribute}`);
  }

  move(dx: number, dy: number): void {
    const next = { ...this.geometry };
    for (const key of this.xKeys) next[key] = Validation.number(next[key]! + dx);
    for (const key of this.yKeys) next[key] = Validation.number(next[key]! + dy);
    this.geometry = next;
  }

  scale(factor: number): void {
    Validation.positive(factor, 'scale factor');
    const next = Object.fromEntries(Object.entries(this.geometry).map(([key, value]) => [key, Validation.number(value * factor)]));
    this.geometry = next;
  }

  summary(): string {
    const geometry = Object.entries(this.geometry).map(([key, value]) => `${key}=${value}`).join(' ');
    const style = Object.entries(this.styles).map(([key, value]) => `${key}=${value}`).join(' ');
    return [this.label, geometry, style].filter(Boolean).join('  ');
  }
}
