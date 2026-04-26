import commonjs from '@rollup/plugin-commonjs';

export default [
  {
    input: './src/index.js',
    external: ['node:vm', 'node:path', 'node:fs/promises', 'node:url', 'node:module'],
    plugins: [commonjs()],
    output: [
      {
        file: './dist/index.cjs',
        exports: 'named',
        format: 'cjs',
        footer: 'module.exports = Object.assign(exports.default, exports);',
      },
    ],
  },
];
