import { createReadStream } from 'node:fs';
import { Editor } from './application/Editor.js';
import { SvgFileStore } from './infrastructure/SvgFileStore.js';
import { Session } from './cli/Session.js';
import { Repl } from './cli/Repl.js';

try {
  const args = process.argv.slice(2);
  if (args.length && (args.length !== 2 || args[0] !== '--script')) throw new Error('usage: npm run cli -- [--script <file>]');
  const input = args[1] ? createReadStream(args[1], { encoding: 'utf8' }) : process.stdin;
  const success = await new Repl(new Session(new Editor(new SvgFileStore()))).run(input, process.stdout);
  if (!success && !process.stdin.isTTY) process.exitCode = 1;
} catch (error) {
  console.log(`error: ${(error instanceof Error ? error.message : String(error)).replace(/[\r\n]+/g, ' ')}`);
  process.exitCode = 1;
}
