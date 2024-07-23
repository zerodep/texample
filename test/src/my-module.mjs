import data from './data.json' with { type: 'json' };
import { bar } from './sub-module.mjs';

export function foo() {
  return { data, bar: bar() };
}
