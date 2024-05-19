import vm from 'node:vm';
import { pathToFileURL } from 'node:url';
import { resolve as resolvePath } from 'node:path';
import fs from 'node:fs/promises';
export { ScriptLinker } from './script-linker.js';
import { ScriptLinker } from './script-linker.js';

const exPattern = /```javascript\n([\s\S]*?)```/gi;

export class ExampleEvaluator {
  /**
   * Constructor
   * @param {string} markdownFilePath markdown file path with javascript examples
   * @param {import('types').PackageDefinition} packageDefinition package.json
   * @param {string} CWD current working directory
   * @param {any} [sandbox] object passed to vm.createContext
   */
  constructor(markdownFilePath, packageDefinition, CWD, sandbox) {
    const exampleFile = (this.exampleFile = resolvePath(CWD, markdownFilePath));
    this.packageDefinition = packageDefinition;
    this.CWD = CWD;
    this.line = 0;
    this.prevCharIdx = 0;
    this.identifier = pathToFileURL(exampleFile).toString();
    this.sandbox = sandbox;
  }
  /**
   * Evaluate markdown
   * @param {number} [blockIdx]
   */
  async evaluate(blockIdx) {
    const blocks = await this.getBlocks();

    for (let idx = 0; idx < blocks.length; idx++) {
      const { script, lineOffset } = blocks[idx];

      if (!isNaN(blockIdx) && idx !== blockIdx) continue;

      this.sandbox.console?.log(`${idx}: ${this.identifier}:${lineOffset}`);

      const loader = new ScriptLinker(this.packageDefinition, this.CWD);
      await script.link(loader.linkFunction);
      await script.evaluate();
    }
  }
  /**
   * Get example blocks
   */
  async getBlocks() {
    const fileContent = await fs.readFile(this.exampleFile);
    /** @type {import('types').ExampleScript[]} */
    const blocks = [];
    const content = fileContent.toString();

    // @ts-ignore
    content.replace(exPattern, (_, scriptBody, idx) => {
      const lineOffset = this.calculateLineOffset(content, idx);
      blocks.push({
        scriptSource: scriptBody,
        lineOffset,
        script: this.parse(scriptBody, lineOffset),
      });
    });

    return blocks;
  }
  /**
   * Parse script
   * @param {string} scriptBody example script
   * @param {number} lineOffset example file line offset
   */
  parse(scriptBody, lineOffset) {
    const identifier = this.identifier;
    return new vm.SourceTextModule(scriptBody, {
      identifier,
      context: vm.createContext(this.sandbox, {
        name: this.packageDefinition.name,
      }),
      lineOffset,
      initializeImportMeta(meta) {
        meta.url = identifier;
      },
    });
  }
  /**
   * Calculate line offset
   * @param {string} content
   * @param {number} charIdx
   */
  calculateLineOffset(content, charIdx) {
    const blockLines = content.substring(this.prevCharIdx, charIdx).split(/\n/g).length;
    this.line = blockLines + (this.line > 0 ? this.line - 1 : 0);
    this.prevCharIdx = charIdx;
    return this.line;
  }
}

export default ExampleEvaluator;
