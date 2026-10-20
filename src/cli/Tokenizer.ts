import type { Token } from './Token.js';

export class Tokenizer {
  tokenize(line: string): readonly Token[] {
    if (line.trimStart().startsWith('#')) return [];
    const result: Token[] = [];
    let index = 0;
    while (index < line.length) {
      if (/\s/u.test(line[index]!)) { index++; continue; }
      const quoted = line[index] === '"';
      let value = '';
      if (quoted) {
        index++;
        let closed = false;
        while (index < line.length) {
          const char = line[index++]!;
          if (char === '"') { closed = true; break; }
          if (char === '\\' && ['"', '\\'].includes(line[index] ?? '')) value += line[index++]!;
          else value += char;
        }
        if (!closed) throw new Error('unterminated double quote');
        if (index < line.length && !/\s/u.test(line[index]!)) throw new Error('expected whitespace after quote');
      } else {
        while (index < line.length && !/\s/u.test(line[index]!)) {
          if (line[index] === '"') throw new Error('quote must start a parameter');
          value += line[index++]!;
        }
      }
      result.push({ value, quoted });
    }
    return result;
  }
}
