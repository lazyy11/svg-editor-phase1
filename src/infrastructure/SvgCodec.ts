import { DOMParser, DOMImplementation, XMLSerializer, type Element, type Node } from '@xmldom/xmldom';
import { SvgDocument } from '../domain/SvgDocument.js';
import { ShapeFactory } from '../domain/ShapeFactory.js';
import { Group } from '../domain/Group.js';
import type { Shape } from '../domain/Shape.js';
import { Validation } from '../domain/Validation.js';

export class SvgCodec {
  private readonly namespace = 'http://www.w3.org/2000/svg';
  private readonly factory = new ShapeFactory();

  decode(source: string): { document: SvgDocument; warnings: readonly string[] } {
    // No entities, scripts, network fetches, CSS or foreign content are executed.
    if (/<!DOCTYPE|<!ENTITY/i.test(source)) throw new Error('invalid SVG: DTD/entities are not supported');
    let xml;
    try {
      xml = new DOMParser({ onError: (_level, message) => { throw new Error(message); } }).parseFromString(source, 'application/xml');
    } catch { throw new Error('invalid SVG: malformed XML'); }
    const root = xml.documentElement;
    if (!root || root.localName !== 'svg' || (root.namespaceURI && root.namespaceURI !== this.namespace)) throw new Error('invalid SVG: expected <svg>');
    this.validateAttributes(root, new Set(['xmlns', 'width', 'height', 'viewBox', 'version']));
    const viewBox = root.getAttribute('viewBox')?.trim().split(/[\s,]+/).map(value => Validation.number(value, 'viewBox'));
    if (viewBox && (viewBox.length !== 4 || viewBox[0] !== 0 || viewBox[1] !== 0)) throw new Error('unsupported SVG viewBox');
    const width = this.dimension(root.getAttribute('width'), viewBox?.[2] ?? 800);
    const height = this.dimension(root.getAttribute('height'), viewBox?.[3] ?? 600);
    if (viewBox && (viewBox[2] !== width || viewBox[3] !== height)) throw new Error('unsupported SVG viewBox: dimensions must match canvas');
    const document = new SvgDocument(width, height);
    const warnings: string[] = [];
    const reserved = new Set<string>();
    const elements = Array.from(root.getElementsByTagName('*'));
    // Reserve *all* explicit ids first, including ids that occur after an unnamed element.
    for (const element of elements) {
      const id = element.getAttribute('id');
      if (id) {
        Validation.id(id);
        if (reserved.has(id)) throw new Error(`id already exists: ${id}`);
        reserved.add(id);
      }
    }
    const counters = new Map<string, number>();
    const readShape = (element: Element, depth: number): Shape => {
      if (depth > 200) throw new Error('SVG nesting limit exceeded (200)');
      if (element.namespaceURI && element.namespaceURI !== this.namespace) throw new Error('unsupported SVG namespace');
      const tag = element.localName ?? element.tagName;
      let id = element.getAttribute('id') ?? '';
      if (!id) {
        let counter = counters.get(tag) ?? 0;
        do { id = `${tag}${++counter}`; } while (reserved.has(id));
        counters.set(tag, counter);
        reserved.add(id);
        warnings.push(`warning: assigned id ${id} to unnamed <${tag}>`);
      }
      const shape = this.factory.empty(tag, id);
      const allowed = new Set(['id', 'fill', 'stroke', 'stroke-width', ...Object.keys(shape.numericAttributes)]);
      if (shape instanceof Group) allowed.add('data-kind'); // Future composite markers degrade to ordinary groups.
      this.validateAttributes(element, allowed);
      for (const attribute of Array.from(element.attributes)) {
        if (attribute.name !== 'id' && attribute.name !== 'data-kind') shape.set(attribute.name, attribute.value);
      }
      const childElements = this.childElements(element);
      if (shape instanceof Group) childElements.forEach(child => shape.insert(readShape(child, depth + 1)));
      else if (childElements.length) throw new Error(`unsupported child element in <${tag}>`);
      if (shape.text !== undefined) shape.set('text', element.textContent ?? '');
      else if (Array.from(element.childNodes).some(node => node.nodeType === 3 && node.nodeValue?.trim())) {
        throw new Error(`unexpected text in <${tag}>`);
      }
      return shape;
    };
    for (const child of this.childElements(root)) document.add(readShape(child, 1));
    return { document, warnings };
  }

  private dimension(value: string | null, fallback: number): number {
    return value === null ? fallback : Validation.positive(value.replace(/px$/, ''), 'canvas dimension');
  }
  private childElements(node: Node): Element[] {
    return Array.from(node.childNodes).filter((child): child is Element => child.nodeType === 1);
  }
  private validateAttributes(element: Element, allowed: ReadonlySet<string>): void {
    for (const attribute of Array.from(element.attributes)) {
      if (!allowed.has(attribute.name)) throw new Error(`unsupported SVG attribute: ${attribute.name}`);
    }
  }

  encode(document: SvgDocument): string {
    const xml = new DOMImplementation().createDocument(this.namespace, 'svg', null);
    const root = xml.documentElement!;
    root.setAttribute('xmlns', this.namespace);
    root.setAttribute('width', String(document.width));
    root.setAttribute('height', String(document.height));
    root.setAttribute('viewBox', `0 0 ${document.width} ${document.height}`);
    const append = (shape: Shape, parent: Element, depth: number): void => {
      const element = xml.createElementNS(this.namespace, shape.tag);
      element.setAttribute('id', shape.id);
      for (const [key, value] of Object.entries(shape.attributes)) element.setAttribute(key, value);
      if (shape.text !== undefined) element.appendChild(xml.createTextNode(shape.text));
      for (const child of shape.children) append(child, element, depth + 1);
      if (shape.children.length) element.appendChild(xml.createTextNode('\n' + '  '.repeat(depth)));
      parent.appendChild(xml.createTextNode('\n' + '  '.repeat(depth)));
      parent.appendChild(element);
    };
    document.children.forEach(shape => append(shape, root, 1));
    root.appendChild(xml.createTextNode('\n'));
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(xml) + '\n';
  }
}
