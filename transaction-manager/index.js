const mysql = require('mysql');
const ConcurrencyManager = require('../concurrency-manager/src/index');
const TransactionLogger = require('../transaction-logger/index');
const { parseArgs } = require('./utils');
const DBError = require('./error');

class TransactionManager { 
    
    static logger = new TransactionLogger();
    static concurrencyManager;
    static db_connection;
    static isConnected = false;

    constructor() {
        TransactionManager.db_connection = TransactionManager.initializeDbConnection();
        TransactionManager.concurrencyManager = new ConcurrencyManager();
    }

    initialize() {
        try {
            TransactionManager.db_connection = TransactionManager.initializeDbConnection();
            TransactionManager.concurrencyManager = new ConcurrencyManager();
            
        } catch (error) {
            console.log(error);
        }
    }

    static convertOperationToQuery(operation, id, args) {
        const operations = {
            'VIEW': `SELECT * FROM Appointments WHERE ID = ${id}`,
            'INSERT': `INSERT INTO Appointments (region) VALUES ('${args[0]}')`,
            'MODIFY': `UPDATE Appointments SET ${args[0]} = ${args[1]} WHERE id = ${id}`,
            'DELETE': `DELETE FROM Appointments WHERE id = ${id}`
        };

        if (operations[operation]) {
            return operations[operation];
        } else {
            throw new Error('Unsupported Operation');
        }
    }

    static setIsolationLevel(db_connection, isolationLevel) {
        return new Promise((resolve, reject) => {
            
            if (!TransactionManager.isConnected) {
                const e = new DBError(DBError.UNABLE_TO_CONNECT);
                reject(e);
            }
            
            const sql = `SET SESSION TRANSACTION ISOLATION LEVEL ${isolationLevel}`;

            db_connection.query(sql, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    static executeQuery(db_connection, sql) {

        return new Promise((resolve, reject) => {
            
            if (!TransactionManager.isConnected) {
                const e = new DBError(DBError.UNABLE_TO_CONNECT);
                reject(e);
            }

            db_connection.query(sql, (err, res) => {
                
                if (err) {
                    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
                        return reject(new DBError(DBError.UNABLE_TO_CONNECT));
                    }

                    return reject(new DBError(DBError.INTERNAL_SERVER_ERROR, err));
                } else {
                    resolve(res);
                }

            })
        })
    }

    async viewAppointment(id) {
        
        return new Promise((resolve, reject) => {
                    
            if (!TransactionManager.isConnected) {
                const e = new DBError(DBError.UNABLE_TO_CONNECT);
                return reject(e);
            }
                        
            const beginViewAppointment = async (err) => {

                if (err) {

                    if (!TransactionManager.isConnected) {
                        const e = new DBError(DBError.UNABLE_TO_CONNECT);
                        return reject(e);
                    }

                    return reject(new DBError(DBError.INTERNAL_SERVER_ERROR, err));
                }
                
                const sql = TransactionManager.convertOperationToQuery(
                    'VIEW', id, []);

                try {

                    const result = await TransactionManager.executeQuery(
                        db_connection, sql);
                    
                    if (result.length === 0) {
                        return reject(new DBError(DBError.RECORD_NOT_FOUND));
                    }
        
                    resolve(result[0]);
                    
                } catch (error) {
                    
                    if (!TransactionManager.isConnected) {
                        const e = new DBError(DBError.UNABLE_TO_CONNECT);
                        return reject(e);
                    }

                    return reject(error);
                }
    
            };
    
            const db_connection = TransactionManager.db_connection;
            TransactionManager.setIsolationLevel(db_connection, 'READ COMMITTED');
            db_connection.beginTransaction({}, beginViewAppointment);

        });
        
    }

    async generateReport() {
        
        return new Promise((resolve, reject) => {

            if (!TransactionManager.isConnected) {
                const e = new DBError(DBError.UNABLE_TO_CONNECT);
                reject(e);
            }

            const db_connection = TransactionManager.db_connection;
            const beginGenerateReport = async (err) => {
                
                if (err) {
                    return reject(new DBError(DBError.INTERNAL_SERVER_ERROR));
                }
                
                const sql = 'SELECT         status, COUNT(status) as total ' + 
                            'FROM           Appointments ' +
                            'GROUP BY       status WITH ROLLUP;';
                TransactionManager.executeQuery(db_connection, sql)
                    .then((res) => resolve(res))
                    .catch((err) => {
                        reject(err)
                    })
                }
                
            TransactionManager.setIsolationLevel(db_connection, 'SERIALIZABLE');
            db_connection.beginTransaction({}, beginGenerateReport);
        });
        
    }

    async addAppointment(region) {

        return new Promise((resolve, reject) => {

            if (!TransactionManager.isConnected) {
                const e = new DBError(DBError.UNABLE_TO_CONNECT);
                return reject(e);
            }

            const db_connection = TransactionManager.db_connection;
            const logger = new TransactionLogger();

            TransactionManager.setIsolationLevel(db_connection, 'READ UNCOMMITTED');

            const lsn = logger.start();

            const beginAddAppointment = async (err) => {

                try {
    
                    const sql = TransactionManager.convertOperationToQuery(
                        'INSERT', null, ['status', region]);
                    const res = await TransactionManager.executeQuery(
                        db_connection, sql);

                    
                    const sql2 = TransactionManager.convertOperationToQuery(
                        'VIEW', res.insertId, []);
                    const info = await TransactionManager.executeQuery(
                        db_connection, sql2);

                    db_connection.commit(async () => {

                        const args = parseArgs(info[0]);

                        logger.addOperation(lsn, 'INSERT', info[0].id, args)
                            .then(() => {
                                logger.end(lsn, 'COMMIT');
                            });
                    });

                    resolve(info);

                } catch (error) {
                    
                    if (!this.isConnected) {
                        logger.end(lsn, 'ABORT');
                        return reject(error);
                    } 

                    db_connection.rollback((err) => {
                
                        if (err) {
                            return reject(new DBError(DBError.INTERNAL_SERVER_ERROR, err));
                        }

                    });
                }

            }

            db_connection.beginTransaction({}, beginAddAppointment);

        });
        
    }

    async modifyStatus(id, status) {
        
        return new Promise((resolve, reject) => {

            const db_connection = TransactionManager.db_connection;
            const logger = new TransactionLogger();
            const concurrency = new ConcurrencyManager();
            
            TransactionManager.setIsolationLevel(db_connection, 'READ COMMITTED');
            
            const lsn = logger.start();
        
            const beginModifyStatus = async (err) => {

                if (err) {
                    db_connection.rollback();
                    reject(err);
                }
                concurrency.watchRecord(id);

                try {
                    
                    const sql = TransactionManager.convertOperationToQuery(
                        'MODIFY', id, [ 'status', `'status'` ]);
                    await TransactionManager.executeQuery(
                        db_connection, sql);

                } catch(error) {
                    // TODO: Implement error handling
                    console.log(error);
                }

                const res = await concurrency.end();

                if (res) {
                        
                    logger.addOperation(lsn, 'MODIFY', id, 'status', status)
                        .then(() => {
                            logger.end(lsn, 'COMMIT');
                        });

                    db_connection.commit(async (err) => {                            

                        const sql = TransactionManager.convertOperationToQuery(
                            'VIEW', id, []);
                        const newRecord = await TransactionManager.executeQuery(
                            db_connection, sql);

                        resolve(newRecord);

                    });

                } else {
                    reject(new DBError(DBError.CONCURRENCY_CONFLICT));
                }

            };
            
            db_connection.beginTransaction({}, beginModifyStatus);
        });
        
    }

    static initializeDbConnection() {
        var conn = mysql.createConnection({
            'host': process.env.DB_SERVER_HOST,
            'port': process.env.DB_SERVER_PORT,
            'user': process.env.DB_SERVER_USER,
            'password': process.env.DB_SERVER_PASS,
            'database': 'SeriousMD'
        });
        
        conn.connect(err => {
            if (err) {
                if (err.code === 'ECONNREFUSED') {
                    const e = new DBError(DBError.UNABLE_TO_CONNECT, err);
                    e.log();
                    TransactionManager.isConnected = false;
                    return;
                }
            };

            TransactionManager.isConnected = true;
            console.log('Transaction Manager connected to the database');
        });

        conn.on('error', (err) => {
            if (err.code === 'PROTOCOL_CONNECTION_LOST') {
                const e = new DBError(DBError.UNABLE_TO_CONNECT, err);
                TransactionManager.isConnected = false;
                e.log();
            }
        });

        return conn;
    }

}

module.exports = TransactionManager

// const x =  new TransactionManager();

// setTimeout(() => {

    
//     for (let i = 0; i < 1000; i++) {
//         x.viewAppointment(i)
//         .catch((err) => {
//             console.log(err);
//         });
//     }
// }, 1000)