export class Validation {
  static number(value: string | number, label = 'number'): number {
    if (typeof value === 'string' && !/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(value)) {
      throw new Error(`invalid ${label}: ${value}`);
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) throw new Error(`invalid ${label}: ${value}`);
    return Object.is(parsed, -0) ? 0 : parsed;
  }

  static positive(value: string | number, label: string): number {
    const parsed = this.number(value, label);
    if (parsed <= 0) throw new Error(`${label} must be positive`);
    return parsed;
  }

  static id(value: string): void {
    if (!value || /[\s\x00-\x1f\x7f]/u.test(value)) throw new Error(`invalid id: ${value}`);
  }

  static paint(value: string): void {
    if (!value.trim() || /url\s*\(|[\x00-\x1f\x7f]/i.test(value)) {
      throw new Error('unsupported paint value');
    }
  }
}
