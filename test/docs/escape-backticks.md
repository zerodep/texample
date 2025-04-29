## Introduction

If you have been a decent chap you probably have decorated your module with lots of code examples in accordance with the "Show me the code"-motto. To be sure that your exampes run correctly you can run through the examples with this module. All you have to do is to wrap your examples with:

` ```javascript `

and run through your README.md with:

```sh
texample ./README.md
```

Any irregularities will be printed at stdout, as well as `console.logs`. E.g:

```sh
0: file:///usr/local/src/projects/zerodep/piso/README.md:31
{ '2007-03-01/2007-04-01': 2007-03-31T22:00:00.000Z }
1: file:///usr/local/src/projects/zerodep/piso/README.md:59
{ PT1M5S: 2025-04-29T04:31:34.219Z }
{
  err: RangeError: ISO 8601 duration fractions are allowed on the smallest unit in the string, e.g. P0.5D or PT1.001S but not P0.5DT1H
      at ISODuration.writeDuration [as write] (file:///usr/local/src/projects/zerodep/piso/src/index.js:969:11)
      at ISODuration.parseDuration [as parse] (file:///usr/local/src/projects/zerodep/piso/src/index.js:900:10)
      at ISOInterval.consumeDuration (file:///usr/local/src/projects/zerodep/piso/src/index.js:274:76)
      at ISOInterval.parseInterval [as parse] (file:///usr/local/src/projects/zerodep/piso/src/index.js:109:10)
      at parseDuration (file:///usr/local/src/projects/zerodep/piso/src/index.js:1299:39)
      at file:///usr/local/src/projects/zerodep/piso/README.md:89:3
      at SourceTextModule.evaluate (node:internal/vm/module:229:23)
      at ExampleEvaluator.evaluate (/usr/local/src/projects/zerodep/piso/node_modules/texample/dist/index.cjs:125:20)
      at async run (/usr/local/src/projects/zerodep/piso/node_modules/texample/cli.cjs:34:5)
}
2: file:///usr/local/src/projects/zerodep/piso/README.md:103
```

To ignore an example snippet use ` ```js `.

## Example

```javascript
console.log('Not ignored');
```

- Indented
  ```javascript
  console.log('Not ignored');
  ```
