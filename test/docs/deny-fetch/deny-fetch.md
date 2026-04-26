# Deny outbound fetch

```javascript
import { setTimeout as delay } from 'node:timers/promises';

await delay(0);
await fetch('https://example.com');
```
