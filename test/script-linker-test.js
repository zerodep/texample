import { pathToFileURL } from 'node:url';
import { resolve as resolvePath } from 'node:path';

import { ScriptLinker } from '../src/index.js';

const CWD = process.cwd();

describe('ScriptLinker', () => {
  describe('link()', () => {
    it('passes a file:// URL to linkModule when resolving the package module', async () => {
      const linker = new ScriptLinker({ name: 'my-module', module: './test/src/my-module.mjs' }, CWD);

      let captured;
      linker.linkModule = function linkModule(identifier) {
        captured = identifier;
        return Promise.resolve();
      };
      linker.linkFunction = linker.link.bind(linker);

      await linker.link('my-module', { identifier: pathToFileURL(resolvePath(CWD, 'README.md')).toString() });

      expect(captured).to.match(/^file:\/\//);
      expect(captured).to.match(/my-module\.mjs$/);
    });

    it('passes a file:// URL to linkModule when resolving a relative specifier', async () => {
      const linker = new ScriptLinker({ name: 'my-module', module: './test/src/my-module.mjs' }, CWD);

      let captured;
      linker.linkModule = function linkModule(identifier) {
        captured = identifier;
        return Promise.resolve();
      };

      const reference = { identifier: pathToFileURL(resolvePath(CWD, 'test/src/my-module.mjs')).toString() };
      await linker.link('./sub-module.mjs', reference);

      expect(captured).to.match(/^file:\/\//);
      expect(captured).to.match(/sub-module\.mjs$/);
    });

    it('passes a file:// URL to linkModule when resolving a bare npm specifier from the consumer', async () => {
      const linker = new ScriptLinker({ name: 'texample' }, CWD);

      let captured;
      linker.linkModule = function linkModule(identifier) {
        captured = identifier;
        return Promise.resolve();
      };

      await linker.link('chai', { identifier: pathToFileURL(resolvePath(CWD, 'README.md')).toString() });

      expect(captured).to.match(/^file:\/\//);
    });

    it('passes node: specifiers through unchanged', async () => {
      const linker = new ScriptLinker({ name: 'my-module' }, CWD);

      let captured;
      linker.linkModule = function linkModule(identifier) {
        captured = identifier;
        return Promise.resolve();
      };

      await linker.link('node:fs', { identifier: pathToFileURL(resolvePath(CWD, 'README.md')).toString() });

      expect(captured).to.equal('node:fs');
    });
  });
});
