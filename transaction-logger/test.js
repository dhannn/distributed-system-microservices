const TransactionLogger = require('.'); // index
const fs = require('fs'); // fs under mocks

jest.mock('fs'); // declare mock folder (?)

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

    expect(fs.getFileBuffer()).toBe('000 START\n001 START\n002 START\n')
});

test('test__most_Current_LSN', () => { // current == mostCurrentLSN + 1
    const x = new TransactionLogger();
    x.start(); // LSN 0
    x.start(); // LSN 1 <- currentLSN

    expect(x.currentLSN).toBe(2); // mostCurrent = x.currentLSN + 1 (next LSN to give for a new log)
})

test('test__add_Operation', () => {
    const x = new TransactionLogger();
    x.start();
    x.addOperation(0, 'INSERT', 1, `04-06-2024 'Mindanao' 'NoShow' 0`); // lsn, operation, primary_key, args

    expect(fs.getFileBuffer()).toBe(`000 START\n000 INSERT 1 04-06-2024 'Mindanao' 'NoShow' 0\n`);
})

test('test__end_Commit', () => {
    const x = new TransactionLogger();
    x.start();
    x.end(0, 'COMMIT');

    expect(fs.getFileBuffer()).toBe(`000 START\n000 COMMIT\n`);

})

test('test__end_Abort', () => {
    const x = new TransactionLogger();
    x.start();
    x.end(0, 'ABORT');

    expect(fs.getFileBuffer()).toBe(`000 START\n000 ABORT\n`);
})

test('test__single_Mixed', () => { // mixed/interleaved transac
    const x = new TransactionLogger();
    x.start();
    x.addOperation(0, 'INSERT', 1, `04-06-2024 'Mindanao' 'NoShow' 0`); // lsn, operation, primary_key, args
    x.end(0, 'COMMIT');

    expect(fs.getFileBuffer()).toBe(`000 START\n000 INSERT 1 04-06-2024 'Mindanao' 'NoShow' 0\n000 COMMIT\n`);
})

test('test__multi_Mixed', () => { // mixed/interleaved transac
    const x = new TransactionLogger();
    x.start(); // LSN 0
    x.addOperation(0, 'INSERT', 1, `04-06-2024 'Mindanao' 'Queued' 0`);
    x.end(0, 'COMMIT');

    x.start(); // LSN 1
    x.addOperation(1, 'INSERT', 2, `04-07-2024 'Luzon' 'Skip' 0`);
    x.end(1, 'ABORT');

    x.start(); // LSN 2
    x.addOperation(2, 'MODIFY', 1, `04-06-2024 'Mindanao' 'Complete' 0`);
    x.end(2, 'COMMIT');

    /* delete operation: "[LSN] DELETE [PRIMARY_KEY]"
    x.start(); // LSN 3
    x.addOperation(2, 'DELETE', 1);
    x.end(2, 'COMMIT'); */

    expect(fs.getFileBuffer()).toBe(`000 START\n000 INSERT 1 04-06-2024 'Mindanao' 'Queued' 0\n000 COMMIT\n001 START\n001 INSERT 2 04-07-2024 'Luzon' 'Skip' 0\n001 ABORT\n002 START\n002 MODIFY 1 04-06-2024 'Mindanao' 'Complete' 0\n002 COMMIT\n`);


    // included delete:
    /*expect(fs.getFileBuffer()).toBe(`
    000 START\n
    000 INSERT 1 04-06-2024 'Mindanao' 'Queued' 0\n
    000 COMMIT\n
    001 INSERT 2 04-07-2024 'Luzon' 'Skip' 0\n
    001 ABORT
    002 MODIFY 1 04-06-2024 'Complete' 0\n
    
    `);*/
})

/**
 * TODO:
 *
 * [✔]  Add check for the tests in start() that the currentLSN 
 *      should be mostCurrentLSN += 1 
 * [✔]  Add test for addOperation() (test MODIFY and INSERT)
 * [✔]  Add test for end() (test ABORT and COMMIT)
 * [✔]  Add test for mixed/interleaved transactions 
 *      [✔] For a single LSNs
 *      [✔] For multiple LSNs
 **/
