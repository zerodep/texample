import nock from 'nock';

nock('https://example.com')
  .get('/api/widgets')
  .reply(200, { widgets: ['alpha', 'bravo', 'charlie'] }, { 'content-type': 'application/json' });
