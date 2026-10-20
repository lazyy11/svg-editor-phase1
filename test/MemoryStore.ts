import type { DocumentStore } from '../src/application/DocumentStore.js';
import type { SvgDocument } from '../src/domain/SvgDocument.js';
import { SvgCodec } from '../src/infrastructure/SvgCodec.js';

export class MemoryStore implements DocumentStore {
  readonly files = new Map<string, string>();
  failWrites = false;
  private readonly codec = new SvgCodec();
  async read(path: string): Promise<{ document: SvgDocument; warnings: readonly string[] }> {
    const source = this.files.get(path);
    if (source === undefined) throw new Error(`cannot read file: ${path}`);
    return this.codec.decode(source);
  }
  async write(path: string, document: SvgDocument): Promise<void> {
    if (this.failWrites) throw new Error(`cannot write file: ${path}`);
    this.files.set(path, this.codec.encode(document));
  }
}
