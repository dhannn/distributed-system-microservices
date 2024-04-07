/**
 * Test Cases for Inserting a Record
 *      Inserting a record, success
 * 
 *      Inserting a record, fail (due to not being able to connect)
 *      - Should send a reject() that needs to be handled by the Node.js controller
 * 
 * Test Cases for Modifying a Record
 * 
 *      Modifying a record, single, success
 * 
 *      Modifying a record, multiple concurrent, success
 *      - ConcurrencyManager.end() should return a Promise that 
 *      - Second record should retry
 * 
 *      Modifying a record, multiple concurrent, multiple retries, success
 * 
 *      Modifying a record, fail (due to failed connection)
 * 
 * 
 */