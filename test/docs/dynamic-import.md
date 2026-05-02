# Dynamic import

```javascript
const os = await import('node:os');
console.log('arch:', typeof os.arch);
```

```javascript
const { ExampleEvaluator } = await import('texample');
console.log('ctor:', typeof ExampleEvaluator);
```
