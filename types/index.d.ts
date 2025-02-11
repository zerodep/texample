declare module 'texample' {
	import type { default as vm } from 'node:vm';
	import type { SourceTextModule } from 'vm';
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
	/**
	 * Script linker
	 * @param packageDefinition package json
	 * */
	export function ScriptLinker(packageDefinition: PackageDefinition, CWD: string): void;
	export class ScriptLinker {
		/**
		 * Script linker
		 * @param packageDefinition package json
		 * */
		constructor(packageDefinition: PackageDefinition, CWD: string);
		packageDefinition: PackageDefinition;
		packageName: string;
		
		module: string;
		CWD: string;
		linkFunction: (specifier: string, reference: import("vm").Module) => Promise<vm.SyntheticModule>;
		/**
		 * Link function used when evaluating source text module, should not be used directly without binding it to itself
		 * use linkFunction instead
		 * */
		link(specifier: string, reference: import("vm").Module): Promise<vm.SyntheticModule>;
		/**
		 * Get current package module path
		 * */
		getPackageModule(specifier: string): string | undefined;
		/**
		 * Link module
		 * */
		linkModule(identifier: string, reference: import("vm").Module): Promise<vm.SyntheticModule>;
	}
  interface ExampleScript {
	scriptSource: string;
	lineOffset: number;
	script: SourceTextModule;
  }

  interface PackageDefinitionExports {
	[x: string]: string | PackageDefinitionExports;
  }

  interface PackageDefinition {
	name: string;
	module?: string;
	main?: string;
	exports?: PackageDefinitionExports | Record<string, string> | Record<string, PackageDefinitionExports>;
  }

	export {};
}

//# sourceMappingURL=index.d.ts.map