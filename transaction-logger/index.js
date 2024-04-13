const fs = require('fs');

if (process.argv.includes('--debug')) {
    const dotenv = require('dotenv');
    dotenv.config();
}

class TransactionLogger {

    static log_directory;

    constructor() {
        TransactionLogger.log_directory = '/root/log_files/Transaction.log';
        console.log(`Transaction Logger initialized at ${TransactionLogger.log_directory}`);
    }

    static currentLSN = 0;

    start() {
        let lsn = TransactionLogger.currentLSN;
        TransactionLogger.currentLSN += 1;
        this.logEntry(lsn, 'START')
        return lsn;
    }

    addOperation(lsn, operation, primary_key, args) { 
        return new Promise((resolve, _) => {
            let entryBody = `${operation} ${primary_key} ${','.join(args)}`;
            this.logEntry(lsn, entryBody, resolve);
        })
    }

    end(lsn, status) {
        this.logEntry(lsn, status)
    }
    
    logEntry(lsn, entryContent, callback) {
        let entry = `${lsn.toString().padStart(3, '0')} ${entryContent}\n`;
        fs.appendFile(TransactionLogger.log_directory, entry, (err) => {
            if (err) {
                console.log(err);
                throw err;
            }
        }, callback);
    }
}

module.exports = TransactionLogger;
