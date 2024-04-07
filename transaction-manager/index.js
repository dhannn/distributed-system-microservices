const mysql = require('mysql');
const ConcurrencyManager = require('../concurrency-manager/src/index');
const TransactionLogger = require('../transaction-logger/index');

class TransactionManager { 
    
    static logger = new TransactionLogger();
    static concurrencyManager = new ConcurrencyManager();
    static db_connection = TransactionManager.initializeDbConnection();

    convertOperationToQuery(operation, id, args) {
        switch (operation) {

            case 'VIEW':
                return `SELECT * FROM Appointments WHERE ID = ${id};`;

            case 'INSERT':
                return `INSERT INTO Appointments (region) VALUES ('${args[0]}');`;
                
            case 'MODIFY':
                return `UPDATE Appointments SET ${args[0]} = ${args[1]} WHERE id = ${id}`;
                
            case 'DELETE':
                return `DELETE FROM Appointments WHERE id = ${id}`;
        
            default:
                throw 'Unsupported Operation';
        }
    }

    setIsolationLevel(db_connection, isolationLevel) {
        const sql = `SET SESSION TRANSACTION ISOLATION LEVEL ${isolationLevel}`;

        db_connection.query(sql, (err) => {
            if (err) {
                throw err;
            }
        });
    }

    viewAppointment(id) {

        return new Promise((resolve, reject) => {
            
            const db_connection = TransactionManager.db_connection;
            
            const beginViewAppointment = (err) => {
                
                if (err) {
                    return db_connection.rollback(() => { throw err; });
                }
                
                const sql = this.convertOperationToQuery('VIEW', id);

                db_connection.query(sql, (err, res) => {
                    if (err) {
                        return db_connection.rollback(() => { throw err;})
                    }

                    resolve(res[0])
                })

            };
            
            this.setIsolationLevel(db_connection, 'READ COMMITTED');
            db_connection.beginTransaction({}, beginViewAppointment);

        });
    }

    generateReport() {
        return new Promise((resolve, reject) => {
            
            const db_connection = TransactionManager.db_connection;
            const beginGenerateReport = (err) => {

                const sql = 'SELECT status, COUNT(status) as Total FROM Appointments GROUP BY status WITH ROLLUP;';
                db_connection.query(sql, (err, res) => {
                    resolve(res);
                })

            }

            db_connection.beginTransaction({}, beginGenerateReport);
        });
    }

    addAppointment(region) {
        const db_connection = TransactionManager.db_connection;
        const beginAddTransaction = (err) => {

            const logger = TransactionManager.logger;
            
            this.setIsolationLevel(db_connection, 'READ UNCOMMITTED');
    
            const lsn = logger.start();

            if (err) {
                return db_connection.rollback(() => { throw err });
            }
            
            const sql = this.convertOperationToQuery('INSERT', null, [region]);
            console.log(sql);
            
            db_connection.query(sql, (err, res) => {
                if (err) {
                    return db_connection.rollback(() => {
                        logger.end(lsn, 'ABORT');
                        throw err;
                    });
                }
                console.log(res.insertId);
                
                db_connection.query('SELECT * FROM Appointments WHERE id = ?', [res.insertId], (err, res) => {
                    logger.addOperation(lsn, 'INSERT', res[0].id, `'${res[0].time_queued.toISOString().slice(0, 19).replace('T', ' ')}' '${res[0].region}' '${res[0].status}' ${res[0].version}`);
                    console.log(res);
                    
                    db_connection.commit();
                    logger.end(lsn, 'COMMIT');
                });

            });
        }

        db_connection.beginTransaction({}, beginAddTransaction);
    }

    modifyStatus(id, status) {

        const db_connection = TransactionManager.db_connection;
        const logger = TransactionManager.logger;
        const concurrency = TransactionManager.concurrencyManager;
        
        this.setIsolationLevel(db_connection, 'READ COMMITTED');
        
        const lsn = logger.start();
        db_connection.beginTransaction((err) => {
            if (err) {
                return db_connection.rollback((err) => {
                    throw err;
                });
            }

            logger.addOperation(lsn, 'MODIFY', id, `Status '${status}'`);
            concurrency.watchRecord(id);
            
            const sql = `UPDATE appointments SET status = '${status}' WHERE id = ${id};`;
            db_connection.query(sql, (err, _) => {
                if (err) {
                    logger.end(lsn, 'ABORT');

                    return db_connection.rollback((err) => {
                        throw err;
                    });
                }
            });
            
            concurrency.end()
                .then((res) => {
                    if (res) {
                        db_connection.commit();
                        logger.end(lsn, 'COMMIT')
                    } else {
                        db_connection.rollback();
                        this.modifyStatus(id, status);
                    }
                }).catch((err) => {
                    logger.end(lsn, 'ABORT');
                });

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

    startOperation(db_connection, concurrency, logger, operations) {

        var { sqls, lsn } = this.prepareTransaction(logger, operations, concurrency);

        db_connection.beginTransaction((err) => {

            if (err) {
                return db_connection.rollback((err) => {
                    throw err;
                });
            }

            for (const s in sqls) {
                const sql = sqls[s];
                db_connection.query(sql, (err, _) => {
                    if (err) {
                        logger.end(lsn, 'ABORT');
    
                        return db_connection.rollback((err) => {
                            throw err;
                        });
                    }
                });
            }
                
            this.endTransaction(concurrency, db_connection, logger, lsn, operations);
        });
     }

    endTransaction(concurrency, db_connection, logger, lsn, operations)
    {
        concurrency.end()
            .then((res) =>
            {
                if (res)
                {
                    db_connection.commit();
                    logger.end(lsn, 'COMMIT');
                } else
                {
                    db_connection.rollback();
                    this.startOperation(db_connection, concurrency, logger, operations);
                }
            }).catch((err) =>
            {
                logger.end(lsn, 'ABORT');
            });
    }

    prepareTransaction(logger, operations, concurrency) {
        const lsn = logger.start();

        let sqls = [];

        for (const o in operations) {
            const operation = operations[o];
            const args = operation.join(' ');

            logger.addOperation(lsn, operation.operation, operation.id, args);
            concurrency.watchRecord(operation.id);
            sqls.push(this.convertOperationToQuery(
                operation.operation, operation.id, operation.args));
        }
        return { sqls, lsn };
    }

}

const x = new TransactionManager()
// const regions = ['Luzon', 'Visayas', 'Mindanao'];
// for (let i = 0; i < 10000; i++) {
//     try {
//         x.addAppointment(regions[i % 3]);
//     } catch (error) {
//         console.log(error);
//     }
// }

x.modifyStatus(2423, 'Complete')
x.generateReport()
    .then((res) => {
        console.log(res);
    })
