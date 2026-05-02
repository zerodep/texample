declare module 'texample' {
	import type { default as vm } from 'node:vm';
	import type { SourceTextModule } from 'vm';
	export default class ExampleEvaluator_1 {
		/**
		 * Constructor
		 * @param markdownFilePath markdown file path with javascript examples
		 * @param packageDefinition package.json
		 * @param CWD current working directory
		 * @param vmContext object passed to vm.createContext as the sandbox; defaults
		 *   to globalThis (giving examples a fully fledged Node global scope). Pass a custom
		 *   object to opt into an isolated sandbox.
		 * @param setupFiles files evaluated as ESM in the same vm context before example blocks
		 */
		constructor(markdownFilePath: string, packageDefinition: PackageDefinition, CWD: string, vmContext?: any, setupFiles?: string[]);
		exampleFile: string;
		packageDefinition: PackageDefinition;
		CWD: string;
		line: number;
		prevCharIdx: number;
		identifier: string;
		sandbox: any;
		setupFiles: string[];
		loader: ScriptLinker_1;
		importModuleDynamically: (specifier: any, referrer: any) => Promise<vm.SyntheticModule>;
		/**
		 * Evaluate markdown
		 * 
		 */
		evaluate(blockIdx?: number): Promise<void>;
		/**
		 * Parse a setup file as a SourceTextModule sharing the example's vm context
		 * */
		parseSetup(setupFile: string): Promise<vm.SourceTextModule>;
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
	/**
	 * Script linker
	 * @param packageDefinition package json
	 * */
	function ScriptLinker_1(packageDefinition: PackageDefinition, CWD: string): void;
	class ScriptLinker_1 {
		/**
		 * Script linker
		 * @param packageDefinition package json
		 * */
		constructor(packageDefinition: PackageDefinition, CWD: string);
		packageDefinition: PackageDefinition;
		packageName: string;
		
		module: string;
		CWD: string;
		consumerRequire: NodeJS.Require;
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
		 * Link module — host-imports the resolved specifier and wraps it in a SyntheticModule so the
		 * exports are visible inside the vm context. With the default `vmContext = globalThis` the host
		 * realm and vm realm share globals, so module-level mutations from these imports (e.g. nock's
		 * fetch interception, chronokinesis's `Date = FakeDate`) are observable to the example.
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

	export { ScriptLinker_1 as ScriptLinker };
}

//# sourceMappingURL=index.d.ts.map