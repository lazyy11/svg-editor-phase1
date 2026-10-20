import type { Shape } from '../domain/Shape.js';
import type { SvgDocument } from '../domain/SvgDocument.js';

export class TreeFormatter {
  tree(document: SvgDocument, id?: string): string {
    const lines: string[] = [];
    const visit = (shape: Shape, prefix: string, connector: string): void => {
      lines.push(prefix + connector + shape.summary());
      const next = prefix + (connector === '' ? '' : connector === '└── ' ? '    ' : '│   ');
      shape.children.forEach((child, index) => visit(child, next, index === shape.children.length - 1 ? '└── ' : '├── '));
    };
    if (id !== undefined) visit(document.find(id), '', '');
    else {
      lines.push(`svg (${document.width}x${document.height})`);
      document.children.forEach((child, index) => visit(child, '', index === document.children.length - 1 ? '└── ' : '├── '));
    }
    return lines.join('\n');
  }
  show(document: SvgDocument, id: string): string {
    const shape = document.find(id);
    const attributes = Object.entries(shape.attributes).map(([key, value]) => `${key}=${value}`).join(' ');
    const text = shape.text === undefined ? '' : `\n  text=${JSON.stringify(shape.text)}`;
    return `${shape.label}  parent=${document.parentLabel(shape)}\n  ${attributes || '(no attributes)'}${text}`;
  }
}
