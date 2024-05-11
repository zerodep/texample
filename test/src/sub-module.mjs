import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const nodeRequire = createRequire(fileURLToPath(import.meta.url));
const data = nodeRequire('./data.json');

export function bar() {
  return data;
}
