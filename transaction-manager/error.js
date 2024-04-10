class DBError {
    static UNABLE_TO_CONNECT = 0;
    static INTERNAL_SERVER_ERROR = 1;
    static RECORD_NOT_FOUND = 2;
    static CONCURRENCY_CONFLICT = 3;
    static messages = {
        [DBError.UNABLE_TO_CONNECT]: 'Database connection error: Unable to connect to database',
        [DBError.INTERNAL_SERVER_ERROR]: 'Internal server error: Unexpected condition occurred while processing the transaction',
        [DBError.RECORD_NOT_FOUND]: 'Record not found: The requested ID cannot be found',
        [DBError.CONCURRENCY_CONFLICT]: 'Concurrency conflict: Another transaction has modified the record concurrently',
    }

    constructor(code, info) {
        this.code = code;
        this.message = DBError.messages[code];
        this.info = info;
    }

    log() {
        console.log('[%o] %s', new Date(), this.message);
    }
}

module.exports = DBError
