# Import JSON

```javascript
import data from '../src/data.json' with { type: 'json' };

console.log('static:', data.bar);
```

```javascript
import pkg from 'chai/package.json' with { type: 'json' };

console.log('bare:', pkg.name);
```

```javascript
const { default: data } = await import('../src/data.json', { with: { type: 'json' } });

console.log('dynamic:', data.bar);
```
