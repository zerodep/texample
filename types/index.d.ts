declare module 'texample' {
	import type { default as vm } from 'node:vm';
	import type { SourceTextModule as SourceTextModule_1 } from 'vm';
	export class ExampleEvaluator {
		/**
		 * Constructor
		 * @param markdownFilePath markdown file path with javascript examples
		 * @param packageName package name from package.json
		 * @param module package entry file from package.json, e.g. same as module
		 * @param CWD current working directory
		 * @param sandbox object passed to vm.createContext
		 */
		constructor(markdownFilePath: string, packageName: string, module: string, CWD: string, sandbox?: any);
		exampleFile: string;
		packageName: string;
		module: string;
		CWD: string;
		line: number;
		prevCharIdx: number;
		identifier: string;
		sandbox: any;
		/**
		 * Evaluate markdown
		 * 
		 */
		evaluate(blockIdx?: number): Promise<void>;
		/**
		 * Get example blocks
		 */
		getBlocks(): Promise<ExampleScript[]>;
		/**
		 * Parse script
		 * @param scriptBody example script
		 * @param lineOffset example file line offset
		 */
		parse(scriptBody: string, lineOffset: number): vm.SourceTextModule;
		/**
		 * Calculate line offset
		 * */
		calculateLineOffset(content: string, charIdx: number): number;
	}
	export default ExampleEvaluator;
	/// <reference types="node" />
	/**
	 * Script linker
	 * @param fileCache optional file cache
	 */
	export function ScriptLinker(packageName: string, module: string, CWD: string, fileCache?: Map<string, string>): void;
	export class ScriptLinker {
		/**
		 * Script linker
		 * @param fileCache optional file cache
		 */
		constructor(packageName: string, module: string, CWD: string, fileCache?: Map<string, string>);
		packageName: string;
		module: string;
		CWD: string;
		
		fileCache: Map<string, string>;
		linkFunction: (specifier: string, reference: any) => Promise<vm.SyntheticModule | vm.SourceTextModule>;
		/**
		 * Link function used when evaluating source text module, should not be used directly without binding it to itself
		 * */
		link(specifier: string, reference: any): Promise<vm.SyntheticModule | vm.SourceTextModule>;
		/**
		 * Link script source
		 * */
		linkScriptSource(scriptPath: string, context: vm.Context): Promise<vm.SourceTextModule>;
		/**
		 * Link node module
		 * */
		linkNodeModule(identifier: string, reference: any): Promise<vm.SyntheticModule>;
		/**
		 * Link internal script
		 * */
		linkInternalScript(scriptPath: string, source: string, context: vm.Context): Promise<vm.SourceTextModule>;
		/**
		 * Get internal module script source
		 * @returns content
		 */
		getInternalScriptSource(scriptPath: string): Promise<string>;
	}
  interface ExampleScript {
	scriptSource: string;
	lineOffset: number;
	script: SourceTextModule_1;
  }
}

//# sourceMappingURL=index.d.ts.map