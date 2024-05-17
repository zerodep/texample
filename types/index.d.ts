declare module 'texample' {
	import type { default as vm } from 'node:vm';
	import type { SourceTextModule as SourceTextModule_1 } from 'vm';
	export class ExampleEvaluator {
		/**
		 * Constructor
		 * @param markdownFilePath markdown file path with javascript examples
		 * @param packageDefinition package.json
		 * @param CWD current working directory
		 * @param sandbox object passed to vm.createContext
		 */
		constructor(markdownFilePath: string, packageDefinition: PackageDefinition, CWD: string, sandbox?: any);
		exampleFile: string;
		packageDefinition: PackageDefinition;
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
	 * @param packageDefinition package json
	 * @param fileCache optional promised file cache
	 */
	export function ScriptLinker(packageDefinition: PackageDefinition, CWD: string, fileCache?: Map<string, Promise<string>>): void;
	export class ScriptLinker {
		/**
		 * Script linker
		 * @param packageDefinition package json
		 * @param fileCache optional promised file cache
		 */
		constructor(packageDefinition: PackageDefinition, CWD: string, fileCache?: Map<string, Promise<string>>);
		packageDefinition: PackageDefinition;
		packageName: string;
		module: any;
		CWD: string;
		
		fileCache: Map<string, Promise<string>>;
		linkFunction: (specifier: string, reference: any) => Promise<vm.SyntheticModule | vm.SourceTextModule>;
		/**
		 * Link function used when evaluating source text module, should not be used directly without binding it to itself
		 * */
		link(specifier: string, reference: any): Promise<vm.SyntheticModule | vm.SourceTextModule>;
		/**
		 * Get current package module path
		 * */
		getPackageModule(specifier: string): string | undefined;
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

  interface PackageDefinitionExports {
	[x: string]: string | PackageDefinitionExports;
  }

  interface PackageDefinition {
	name: string;
	module?: string;
	exports?: PackageDefinitionExports | Record<string, string> | Record<string, PackageDefinitionExports>;
  }
}

//# sourceMappingURL=index.d.ts.map