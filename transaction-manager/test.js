/**
 * Test Cases for Viewing a Record
 *      Viewing a record, success
 * 
 *      Viewing a record, fail (due to invalid ID)
 *      - Should send a reject(DB_ERROR.RECORD_NOT_FOUND)
 * 
 *      Viewing a record, fail (due to not being able to connect)
 *      - Should send a reject(DBError.DATABASE_CONNECTION) that needs to be handled by the Node.js controller
 * 
 * Test Cases for Inserting a Record
 *      Inserting a record, success
 * 
 *      Inserting a record, fail (due to not being able to connect)
 *      - Should send a reject(DBError.DATABASE_CONNECTION) that needs to be handled by the Node.js controller
 * 
 * Test Cases for Modifying a Record
 * 
 *      Modifying a record, single, success
 * 
 *      Modifying a record, multiple concurrent of the same record
 *      - Should send a reject(DBError.CONCURRENCY_CONFLICT) that needs to be handled 
 * 
 *      Modifying a record, fail (due to failed connection)
 *      - Should send a reject(DBError.DATABASE_CONNECTION)
 * 
 * 
 */

const TransactionManager = require('.');
const ConcurrencyControl = require('../concurrency-manager/src/index');
const mysql = require('mysql');
const fs = require('fs');

const resetDatabase = () => {
    TransactionManager.db_connection = mysql.createConnection();
    ConcurrencyControl.db_connection = mysql.createConnection();
};

beforeEach(() => {
    resetDatabase();
    fs.resetFileBuffer();
});

test('test__insertingSingleRecord', () => {
    const x = new TransactionManager();
    
});

