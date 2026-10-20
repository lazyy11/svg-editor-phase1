import { Validation } from '../domain/Validation.js';

export class CommandArguments {
  static number(value: string): number { return Validation.number(value); }
  static positive(value: string, label: string): number { return Validation.positive(value, label); }
}
