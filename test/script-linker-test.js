import { ScriptLinker } from '../src/script-linker.js';

describe('script linker', () => {
  it('file content cache is optional', () => {
    const scriptLinker = new ScriptLinker({ name: 'module', module: './module.js' }, '.');
    expect(scriptLinker.fileCache).to.instanceof(Map);
  });
});
