import { SourceTextModule } from 'vm';

export interface ExampleScript {
  scriptSource: string;
  lineOffset: number;
  script: SourceTextModule;
}

export interface PackageDefinitionExports {
  [x: string]: string | PackageDefinitionExports;
}

export interface PackageDefinition {
  name: string;
  module?: string;
  exports?: PackageDefinitionExports | Record<string, string> | Record<string, PackageDefinitionExports>;
}
