const mysql = require('mysql')

if (process.argv.includes('--debug')) {
    const dotenv = require('dotenv');
    dotenv.config();
}

class ConcurrentTransaction {

    static db_connection = ConcurrentTransaction.initializeDbConnection();
    static remote_dbs = ConcurrentTransaction.initializeDbConnections();
    static dbs = ConcurrentTransaction.initializeDbConnections();
    read_timestamps = {}

    static initializeDbConnection() {
        var conn = mysql.createConnection({
            'host': process.env.DB_SERVER_HOST,
            'port': process.env.DB_SERVER_PORT,
            'user': process.env.DB_SERVER_USER,
            'password': process.env.DB_SERVER_PASS,
            'database': 'SeriousMD'
        });
        
        conn.connect(err => {
            console.log('Concurrency Manager connected to the database');
        });
        
        conn.on('error', (err) => {
            if (err.code === 'PROTOCOL_CONNECTION_LOST') {
                console.error('[%s] Database connection error: Unable to connect to database', new Date());
            }
        });

        return conn;
    }

    static initializeDbConnections() {

        const hosts = process.env.DB_SERVER_HOSTS.split(';');
        const users = process.env.DB_SERVER_USERS.split(';');
        const passess = process.env.DB_SERVER_PASSES.split(';');

        let conns = [];

        for (let i = 0; i < hosts.length; i++) {
            let conn = mysql.createConnection({
                'host': hosts[i],
                'port': process.env.DB_SERVER_PORT,
                'user': users[i],
                'password': passess[i],
                'database': 'SeriousMD'
            });

            conn.connect(err => {
                if (err) {
                    return console.log('Error %o', err);
                }

                console.log('Concurrency manager is connected to remote databases');
            });

            conns.push(conn);
        
            conn.on('error', (err) => {
                if (err.code === 'PROTOCOL_CONNECTION_LOST') {
                    console.error('[%s] Database connection error: Unable to connect to database', new Date());
                }
            });
        }

        return conns;
    }


    watchRecord(primary_key) {
        this.queryVersion(
            ConcurrentTransaction.db_connection, primary_key, (err, res) => {
            if (err) {
                throw err;
            }

            this.read_timestamps[primary_key] = {
                [ConcurrentTransaction.db_connection.threadId]: res
            };
        });

        this.queryVersion(
            ConcurrentTransaction.dbs[0], primary_key, (err, res) => {
            if (err) {
                throw err;
            }

            this.read_timestamps[primary_key] = {
                [ConcurrentTransaction.dbs[0].threadId]: res
            };
        });

        this.queryVersion(
            ConcurrentTransaction.dbs[1], primary_key, (err, res) => {
            if (err) {
                throw err;
            }

            this.read_timestamps[primary_key] = {
                [ConcurrentTransaction.dbs[1].threadId]: res
            };
        });
    }

    end() {
        let promises = [];
        const dbs = [
            ConcurrentTransaction.db_connection,
            ConcurrentTransaction.dbs[0],
            ConcurrentTransaction.dbs[1]
        ]

        for (const key in this.read_timestamps) {
            promises.push(new Promise((resolve, reject) => {
                
                for (const db in dbs) {
                    const previous_timestamp = this.read_timestamps[key][dbs[db].threadId];

                    this.queryVersion(dbs[db], key, (err, res) => {
                        
                        if (err) {
                            return reject(err);
                        }

                        resolve(previous_timestamp === res);
                    });
                    
                }
            }));
        };

        return new Promise((resolve, reject) => {
            
            Promise.all(promises)
                .then((res) => {
                    resolve(res.every(v => v === true));
                }).catch((err) => {
                    reject(err);
                });
        });
        
    }

    queryVersion(conn, primary_key, callback) {
            conn.query(
            'SELECT version FROM Appointments WHERE id = ?', [primary_key],
            (err, res) =>
            {
                if (err) {
                    callback(err, null);
                    throw err;
                };

                if (res.length === 0)
                    callback(false, undefined);
                callback(false, res[0].version);

            }
        );
    }
}

module.exports = ConcurrentTransaction
