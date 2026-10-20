import { SvgDocument } from '../domain/SvgDocument.js';
import { History } from './History.js';
import type { DocumentStore } from './DocumentStore.js';
import type { EditCommand } from './EditCommand.js';

export class Editor {
  private current: SvgDocument | undefined;
  private path: string | undefined;
  private readonly history = new History();
  constructor(private readonly store: DocumentStore) {}

  get document(): SvgDocument {
    if (!this.current) throw new Error("no document. use 'init' or 'read' first");
    // Queries cannot mutate the live document behind the history manager.
    return this.current.clone();
  }
  init(width = 800, height = 600): string {
    const next = new SvgDocument(width, height);
    this.current = next;
    this.path = undefined;
    this.history.blockAfterIO();
    return `canvas ${width}x${height} created`;
  }
  async read(path: string): Promise<readonly string[]> {
    const loaded = await this.store.read(path);
    this.current = loaded.document.clone();
    this.path = path;
    this.history.blockAfterIO();
    return [...loaded.warnings, `read ${path} (${this.current.shapes.length} elements)`];
  }
  async save(path?: string): Promise<string> {
    const document = this.document;
    const target = path ?? this.path;
    if (!target) throw new Error('no file path. use save <file.svg>');
    await this.store.write(target, document);
    this.path = target;
    this.history.blockAfterIO();
    return `saved to ${target} (${document.shapes.length} elements)`;
  }
  canvas(width?: number, height?: number): string {
    const document = this.document;
    if (width !== undefined && height !== undefined) {
      document.resize(width, height);
      this.current = document;
      this.history.blockAfterIO();
    }
    return `canvas ${document.width}x${document.height}`;
  }
  edit(command: EditCommand): string {
    const before = this.document;
    const after = before.clone();
    const summary = command.apply(after);
    command.remember(before, after);
    this.current = after;
    this.history.record(command);
    return summary;
  }
  undo(): string { this.document; this.current = this.history.undo(); return 'undone: last edit restored'; }
  redo(): string { this.document; this.current = this.history.redo(); return 'redone: last edit restored'; }
}
