import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve, relative, sep, basename } from 'node:path';
import ts from 'typescript';

export class ArchitectureCheck {
  private readonly root = resolve('src');
  private readonly allowed = new Map<string, readonly string[]>([
    ['domain', ['domain']], ['application', ['application', 'domain']],
    ['cli', ['cli', 'application']], ['infrastructure', ['infrastructure', 'application', 'domain']],
  ]);
  private files(path: string): string[] {
    return readdirSync(path, { withFileTypes: true }).flatMap(entry => entry.isDirectory()
      ? this.files(join(path, entry.name)) : entry.name.endsWith('.ts') ? [join(path, entry.name)] : []);
  }
  run(): void {
    const errors: string[] = [];
    let imports = 0;
    const files = this.files(this.root);
    for (const path of files) {
      const name = relative(this.root, path);
      const layer = name.split(sep)[0]!;
      const source = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true);
      const visit = (node: ts.Node): void => {
        if (ts.isSwitchStatement(node)) errors.push(`${name}: switch dispatch is prohibited`);
        if (ts.isFunctionDeclaration(node)) errors.push(`${name}: free function is prohibited`);
        if (ts.isClassDeclaration(node) && node.name?.text !== basename(path, '.ts')) errors.push(`${name}: class/file name mismatch`);
        if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
          imports++;
          const target = node.moduleSpecifier.text;
          if (target.startsWith('.')) {
            const destination = relative(this.root, resolve(path, '..', target)).split(sep)[0]!;
            if (name !== 'main.ts' && !this.allowed.get(layer)?.includes(destination)) errors.push(`${name}: forbidden dependency ${target}`);
          } else if (['domain', 'application'].includes(layer)) errors.push(`${name}: external dependency ${target}`);
          else if (layer === 'cli' && !target.startsWith('node:')) errors.push(`${name}: CLI external dependency ${target}`);
        }
        ts.forEachChild(node, visit);
      };
      visit(source);
    }
    if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
    else console.log(`Architecture OK: ${files.length} TypeScript source files, ${imports} imports; dependency directions, class/file names and no free functions/switch verified.`);
  }
}

new ArchitectureCheck().run();
