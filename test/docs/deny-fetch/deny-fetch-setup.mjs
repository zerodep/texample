globalThis.fetch = () => {
  throw new Error('fetch denied');
};
