// Setup file that intentionally throws so the test can verify error propagation
// and that the stack frame points back at this file (not the example markdown).
const reason = 'boom from setup';
throw new Error(reason);
