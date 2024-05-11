import { SourceTextModule } from 'vm';

export interface ExampleScript {
  scriptSource: string;
  lineOffset: number;
  script: SourceTextModule;
}
