# globals

```javascript
import { equal, notDeepEqual, deepEqual } from 'node:assert';
import * as ck from 'chronokinesis';

ck.freeze(1970, 3, 11);

equal(true, ck.isKeepingTime(), 'chronokinesis is keeping time');
deepEqual(new Date(), new Date(1970, 3, 11), 'globals are shared');

ck.reset();
```
