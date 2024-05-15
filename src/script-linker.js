import vm from 'node:vm';
import fs from 'node:fs/promises';
import { dirname, extname, resolve as resolvePath, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/**
 * Script linker
 * @param {string} packageName
 * @param {string} module
 * @param {string} CWD
 * @param {Map<string, string>} [fileCache] optional file cache
 */
export function ScriptLinker(packageName, module, CWD, fileCache) {
  this.packageName = packageName;
  this.module = module;
  this.CWD = CWD;
  /** @type {Map<string, string>} */
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
  if (specifier === this.packageName) {
    modulePath = resolvePath(this.CWD, this.module);
    return this.linkScriptSource(modulePath, reference.context);
  } else if (isRelative(specifier)) {
    modulePath = resolvePath(dirname(fileURLToPath(reference.identifier)), specifier.split(sep).join(sep));
    return this.linkScriptSource(modulePath, reference.context);
  } else {
    return this.linkNodeModule(specifier, reference);
  }
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
ScriptLinker.prototype.getInternalScriptSource = async function getInternalScriptSource(scriptPath) {
  const fileCache = this.fileCache;
  let content = fileCache?.get(scriptPath);
  if (content) return content;

  content = (await fs.readFile(scriptPath)).toString();
  if (extname(scriptPath) === '.json') {
    content = `export default ${content};`;
  }

  fileCache?.set(scriptPath, content);
  return content;
};

/**
 * Path is relative
 * @param {string} p path
 */
function isRelative(p) {
  const p0 = p.split(sep).shift();
  return p0 === '.' || p0 === '..';
}
