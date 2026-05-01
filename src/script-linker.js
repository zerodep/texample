import vm from 'node:vm';
import { dirname, resolve as resolvePath, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

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
  this.consumerRequire = createRequire(resolvePath(CWD, 'package.json'));
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
    specifier = pathToFileURL(resolvePath(this.CWD, modulePath)).href;
  } else if (isRelative(specifier)) {
    specifier = pathToFileURL(resolvePath(dirname(fileURLToPath(reference.identifier)), specifier.split(sep).join(sep))).href;
  } else if (!specifier.startsWith('node:')) {
    // Bare npm specifier: resolve from the consumer's project (this.CWD), not from
    // texample's own node_modules. Without this anchor `await import('pino')` from
    // dist/index.cjs would look in texample's tree and fail with ERR_MODULE_NOT_FOUND.
    // The resolved path must be a file:// URL so dynamic import works on Windows,
    // where `C:\...` would otherwise be parsed as a `c:` URL scheme.
    // If resolution fails (truly missing), fall through with the original specifier
    // so dynamic import surfaces the ESM-style error the tests expect.
    try {
      specifier = pathToFileURL(this.consumerRequire.resolve(specifier)).href;
    } catch {
      // intentionally swallowed
    }
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
 * Link module — host-imports the resolved specifier and wraps it in a SyntheticModule so the
 * exports are visible inside the vm context. With the default `vmContext = globalThis` the host
 * realm and vm realm share globals, so module-level mutations from these imports (e.g. nock's
 * fetch interception, chronokinesis's `Date = FakeDate`) are observable to the example.
 * @param {string} identifier
 * @param {import('vm').Module} reference
 */
ScriptLinker.prototype.linkModule = async function linkModule(identifier, reference) {
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
