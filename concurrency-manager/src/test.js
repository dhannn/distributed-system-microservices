const ConcurrentTransaction = require('.');
const mysql = require('mysql');

jest.mock('mysql')

test('test__queryVersion', () => {
    const x = new ConcurrentTransaction();
    x.queryVersion(0, (_, res) => {
        expect(res).toBe(0);
    });

});

test('test__modifyRecord', () => {
    const x = new ConcurrentTransaction();
    x.watchRecord(1);

    expect(x.read_timestamps[1].version).toBe(1);
});

test('test__concurrencyControl_Success', () => {
    const x = new ConcurrentTransaction();
    x.watchRecord(0);
    x.end()
        .then((value) => expect(value).toBe(true));
});

test('test__concurrencyControl_Fail', () => {
    const x = new ConcurrentTransaction();
    x.watchRecord(0);

    ConcurrentTransaction.db_connection.modify(0);

    x.end()
        .then((value) => expect(value).toBe(false));

    expect(x.read_timestamps[0].version).toBe(0)
    x.queryVersion(0, (_, res) => {
        expect(res).toBe(1);
    })
})

test('test__concurrencyControl_MultipleFail', () => {
    const x = new ConcurrentTransaction();
    x.watchRecord(0);
    x.watchRecord(1);

    ConcurrentTransaction.db_connection.modify(1);

    x.end()
        .then()
})
