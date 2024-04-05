const TransactionLogger = require('.');
const fs = require('fs');

jest.mock('fs');

beforeEach(() => {
    fs.resetFileBuffer();
});

test('test__start_Single', () => {
    const x = new TransactionLogger();
    x.start();

    expect(fs.getFileBuffer()).toBe('000 START\n');
});

test('test__start_Multiple', () => {
    const x = new TransactionLogger();
    x.start();
    x.start();
    x.start();

    expect(fs.getFileBuffer()).toBe('000 START\n001 START\n002 START')
});

/**
 * TODO:
 *
 * [ ]  Add check for the tests in start() that the currentLSN 
 *      should be mostCurrentLSN += 1 
 * [ ]  Add test for addOperation() (test MODIFY and INSERT)
 * [ ]  Add test for end() (test ABORT and COMMIT)
 * [ ]  Add test for mixed/interleaved transactions 
 *      [ ] For a single LSNs
 *      [ ] For multiple LSNs
 */
