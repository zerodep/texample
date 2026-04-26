import Mocha from 'mocha';
import nock from 'nock';

nock('https://example.com')
  .get('/api/widgets')
  .reply(200, { widgets: ['alpha', 'bravo', 'charlie'] }, { 'content-type': 'application/json' });

const mocha = new Mocha({ ui: 'bdd', reporter: 'min' });
mocha.suite.emit('pre-require', globalThis, 'mocha-example', mocha);

globalThis.runMocha = () =>
  new Promise((resolve, reject) => {
    mocha.run((failures) => (failures ? reject(new Error(`${failures} mocha test(s) failed`)) : resolve()));
  });
