# Mocha example

```javascript
import { expect } from 'chai';

describe('widgets API', () => {
  it('returns the expected widget list', async () => {
    const response = await fetch('https://example.com/api/widgets');

    expect(response.status).to.equal(200);
    expect(response.headers.get('content-type')).to.match(/json/);

    const body = await response.json();
    expect(body).to.deep.equal({ widgets: ['alpha', 'bravo', 'charlie'] });
  });
});

await runMocha();
```
