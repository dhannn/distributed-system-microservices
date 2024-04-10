const fs = require('./__mocks__/fs');

if (process.argv.includes('--debug')) {
    const dotenv = require('dotenv');
    dotenv.config();
}

class TransactionLogger {

    static log_directory = process.env.LOG_DIRECTORY;

    currentLSN = 0;

    start() {
        let lsn = this.currentLSN;
        this.currentLSN += 1;
        this.logEntry(lsn, 'START')
        return lsn;
    }

    addOperation(lsn, operation, primary_key, args) {
        let entryBody = `${operation} ${primary_key} ${args}`;
        this.logEntry(lsn, entryBody);
    }

    end(lsn, status) {
        this.logEntry(lsn, status)
    }
    
    logEntry(lsn, entryContent) {
        let entry = `${lsn.toString().padStart(3, '0')} ${entryContent}`;
        fs.appendFile(TransactionLogger.log_directory, entry)
    }
}

module.exports = TransactionLogger;
