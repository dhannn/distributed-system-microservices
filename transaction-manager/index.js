const mysql = require('mysql');
const ConcurrencyManager = require('../concurrency-manager/src/index');
const TransactionLogger = require('../transaction-logger/index');

class TransactionManager { 
    
    static logger = new TransactionLogger();
    static concurrencyManager = new ConcurrencyManager();
    static db_connection = TransactionManager.initializeDbConnection();

    static convertOperationToQuery(operation, id, args) {
        const operations = {
            'VIEW': `SELECT * FROM Appointments WHERE ID = ${id};`,
            'INSERT': `INSERT INTO Appointments (region) VALUES ('${args[0]}');`,
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
            db_connection.query(sql, (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            })
        })
    }

    async viewAppointment(id) {
        
        return new Promise((resolve, reject) => {
                        
            const beginViewAppointment = async (err) => {
                
                if (err) {
                    // TODO: Handle and send the correct error class through reject()
                }
                
                const sql = TransactionManager.convertOperationToQuery('VIEW', id, []);
                const result = await TransactionManager.executeQuery(db_connection, sql);
    
                resolve(result[0])
    
            };
    
            const db_connection = TransactionManager.db_connection;
            TransactionManager.setIsolationLevel(db_connection, 'READ COMMITTED');
            db_connection.beginTransaction({}, beginViewAppointment);

        });
        
    }

    async generateReport() {
        
        return new Promise((resolve, reject) => {

            const db_connection = TransactionManager.db_connection;
            const beginGenerateReport = async (err) => {
                
                if (err) {
                    
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
    
            db_connection.beginTransaction({}, beginGenerateReport);
        });
        
    }

    async addAppointment(region) {

        return new Promise((resolve, reject) => {
            const db_connection = TransactionManager.db_connection;
            const logger = new TransactionLogger();

            TransactionManager.setIsolationLevel(db_connection, 'READ UNCOMMITTED');

            const lsn = logger.start();

            const beginAddAppointment = async (err) => {

                if (err) {
                    logger.end(lsn, 'ABORT');
                    db_connection.rollback(() => { throw err; });
                }

                try {
    
                    const sql = TransactionManager.convertOperationToQuery('INSERT', null, ['status', region]);
                    const res = await TransactionManager.executeQuery(db_connection, sql);

                    const sql2 = TransactionManager.convertOperationToQuery('VIEW', res.insertId, []);
                    const info = await TransactionManager.executeQuery(db_connection, sql2);

                    db_connection.commit(async (err) => {

                        const args = `'${convertJSDateToMySQL(info[0].time_queued)}' '${info[0].region}' '${info[0].status}' ${info[0].version}`;

                        logger.addOperation(lsn, 'INSERT', info[0].id, args)
                            .then(() => {
                                logger.end(lsn, 'COMMIT');
                            });

                    });

                    resolve(info);

                } catch (error) {

                    logger.end(lsn, 'ABORT');
                    db_connection.rollback(() => { throw error })
                    reject(error);

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
                    
                    const sql = TransactionManager.convertOperationToQuery('MODIFY', id, [ 'status', status ]);
                    console.log('SQL: ' + sql);
                    await TransactionManager.executeQuery(db_connection, sql);

                } catch(error) {
                    // TODO: Implement error handling
                    console.log(error);
                }

                try {
                    
                    const res = await concurrency.end();

                    if (res) {
                        
                            
                        logger.addOperation(lsn, 'MODIFY', id, 'status', status)
                            .then(() => {
                                logger.end(lsn, 'COMMIT');
                            });

                        db_connection.commit(async (err) => {                            
    
                            const sql = TransactionManager.convertOperationToQuery('VIEW', id, []);
                            const newRecord = await TransactionManager.executeQuery(db_connection, sql);
    
                            resolve(newRecord);

                        });

                    } else {
                        reject(/** TOOD: Add proper interface */);
                    }

                } catch (error) {
                    // TODO: Implement error handling
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
            if (err) throw err;
            console.log('Transaction Manager connected to the database');
        });

        return conn;
    }

}

function convertJSDateToMySQL(date) {
    return date.toISOString().slice(0, 19).replace('T', ' ');
}
