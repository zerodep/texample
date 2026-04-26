// Reads import.meta.url so the test can confirm parseSetup's
// initializeImportMeta callback wires the file URL into the SourceTextModule.
globalThis.probe.url = import.meta.url;
