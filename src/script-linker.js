import vm from 'node:vm';
import { dirname, resolve as resolvePath, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Script linker
 * @param {import('types').PackageDefinition} packageDefinition package json
 * @param {string} CWD
 */
export function ScriptLinker(packageDefinition, CWD) {
  this.packageDefinition = packageDefinition;
  this.packageName = packageDefinition.name;
  const exports = packageDefinition.exports;
  /** @type {string} */
  // @ts-ignore
  this.module = exports?.['.']?.import || exports?.import || packageDefinition.module || packageDefinition.main;
  this.CWD = CWD;
  this.linkFunction = this.link.bind(this);
}

/**
 * Link function used when evaluating source text module, should not be used directly without binding it to itself
 * use linkFunction instead
 * @param {string} specifier
 * @param {import('vm').Module} reference
 */
ScriptLinker.prototype.link = function link(specifier, reference) {
  let modulePath;
  if ((modulePath = this.getPackageModule(specifier))) {
    specifier = resolvePath(this.CWD, modulePath);
  } else if (isRelative(specifier)) {
    specifier = resolvePath(dirname(fileURLToPath(reference.identifier)), specifier.split(sep).join(sep));
  }

  return this.linkModule(specifier, reference);
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

  return exports[`.${subModule}`]?.import || exports[`.${subModule}`]?.require;
};

/**
 * Link module
 * @param {string} identifier
 * @param {import('vm').Module} reference
 */
ScriptLinker.prototype.linkModule = async function linkNodeModule(identifier, reference) {
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
 * Path is relative
 * @param {string} p path
 */
function isRelative(p) {
  const p0 = p.split(sep).shift();
  return p0 === '.' || p0 === '..';
}
