import { readFile, writeFile, rename, unlink } from 'node:fs/promises';
import { dirname, basename, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { DocumentStore } from '../application/DocumentStore.js';
import type { SvgDocument } from '../domain/SvgDocument.js';
import { SvgCodec } from './SvgCodec.js';

export class SvgFileStore implements DocumentStore {
  private readonly codec = new SvgCodec();
  async read(path: string): Promise<{ document: SvgDocument; warnings: readonly string[] }> {
    let source: string;
    try { source = await readFile(path, 'utf8'); }
    catch { throw new Error(`cannot read file: ${path}`); }
    if (Buffer.byteLength(source, 'utf8') > 5 * 1024 * 1024) throw new Error('SVG file exceeds 5 MiB');
    return this.codec.decode(source);
  }
  async write(path: string, document: SvgDocument): Promise<void> {
    const temporary = join(dirname(path), `.${basename(path)}.${randomUUID()}.tmp`);
    try {
      await writeFile(temporary, this.codec.encode(document), { encoding: 'utf8', flag: 'wx' });
      await rename(temporary, path);
    } catch {
      throw new Error(`cannot write file: ${path}`);
    } finally {
      await unlink(temporary).catch(() => undefined);
    }
  }
}
