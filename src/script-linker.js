import vm from 'node:vm';
import fs from 'node:fs/promises';
import { dirname, extname, resolve as resolvePath, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/**
 * Script linker
 * @param {import('types').PackageDefinition} packageDefinition package json
 * @param {string} CWD
 * @param {Map<string, Promise<string>>} [fileCache] optional promised file cache
 */
export function ScriptLinker(packageDefinition, CWD, fileCache) {
  this.packageDefinition = packageDefinition;
  this.packageName = packageDefinition.name;
  const exports = packageDefinition.exports;
  // @ts-ignore
  this.module = exports?.['.']?.import || exports?.import || packageDefinition.module;
  this.CWD = CWD;
  /** @type {Map<string, Promise<string>>} */
  this.fileCache = fileCache ?? new Map();
  this.linkFunction = this.link.bind(this);
}

/**
 * Link function used when evaluating source text module, should not be used directly without binding it to itself
 * @param {string} specifier
 * @param {any} reference
 * @returns {Promise<vm.SyntheticModule | vm.SourceTextModule>}
 */
ScriptLinker.prototype.link = function linkScript(specifier, reference) {
  let modulePath;
  if ((modulePath = this.getPackageModule(specifier))) {
    modulePath = resolvePath(this.CWD, modulePath);
    return this.linkScriptSource(modulePath, reference.context);
  } else if (isRelative(specifier)) {
    modulePath = resolvePath(dirname(fileURLToPath(reference.identifier)), specifier.split(sep).join(sep));
    return this.linkScriptSource(modulePath, reference.context);
  } else {
    return this.linkNodeModule(specifier, reference);
  }
};

/**
 * Get current package module path
 * @param {string} specifier
 * @returns {string | undefined}
 */
ScriptLinker.prototype.getPackageModule = function getPackageModule(specifier) {
  const packageName = this.packageName;
  if (!specifier.startsWith(packageName)) return;
  if (specifier === packageName) return this.module;

  const subModule = specifier.substring(packageName.length);

  /** @type {any} */
  const exports = this.packageDefinition.exports;

  if (!exports) return;

  return exports[`.${subModule}`]?.import;
};

/**
 * Link script source
 * @param {string} scriptPath
 * @param {vm.Context} context
 */
ScriptLinker.prototype.linkScriptSource = async function linkScriptSource(scriptPath, context) {
  const source = await this.getInternalScriptSource(scriptPath);
  return this.linkInternalScript(scriptPath, source, context);
};

/**
 * Link node module
 * @param {string} identifier
 * @param {any} reference
 * @returns
 */
ScriptLinker.prototype.linkNodeModule = async function linkNodeModule(identifier, reference) {
  const imported = await import(identifier);
  const exported = Object.keys(imported);

  return new vm.SyntheticModule(
    exported,
    function evaluateCallback() {
      exported.forEach((key) => this.setExport(key, imported[key]));
    },
    { identifier, context: reference.context },
  );
};

/**
 * Link internal script
 * @param {string} scriptPath
 * @param {string} source
 * @param {vm.Context} context
 */
ScriptLinker.prototype.linkInternalScript = async function linkInternalScript(scriptPath, source, context) {
  const identifier = pathToFileURL(scriptPath).toString();
  const module = new vm.SourceTextModule(source, {
    identifier,
    context,
    initializeImportMeta(meta) {
      meta.url = identifier;
    },
  });
  await module.link(this.linkFunction);
  return module;
};

/**
 * Get internal module script source
 * @param {string} scriptPath
 * @returns {Promise<string>} content
 */
ScriptLinker.prototype.getInternalScriptSource = function getInternalScriptSource(scriptPath) {
  const fileCache = this.fileCache;
  let promisedContent = fileCache?.get(scriptPath);
  if (promisedContent) return promisedContent;

  promisedContent = fs.readFile(scriptPath).then((b) => {
    const fileContent = b.toString();
    let content = fileContent;
    if (extname(scriptPath) === '.json') {
      content = `export default ${fileContent};`;
    }
    return content;
  });

  fileCache?.set(scriptPath, promisedContent);

  return promisedContent;
};

/**
 * Path is relative
 * @param {string} p path
 */
function isRelative(p) {
  const p0 = p.split(sep).shift();
  return p0 === '.' || p0 === '..';
}
