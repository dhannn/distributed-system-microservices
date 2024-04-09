class DBError {
    static DATABASE_CONNECTION_ERROR = 0;
    static INTERNAL_SERVER_ERROR = 1;
    static RECORD_NOT_FOUND = 2;
    static CONCURRENCY_CONFLICT = 3;
    static messages = {
        [DBError.DATABASE_CONNECTION_ERROR]: 'Unable to connect to database',
        [DBError.INTERNAL_SERVER_ERROR]: 'Unexpected condition occurred while processing the transaction',
        [DBError.RECORD_NOT_FOUND]: 'The requested ID cannot be found',
        [DBError.CONCURRENCY_CONFLICT]: 'Another transaction has modified the record concurrently',
    }

    constructor(code, info) {
        return {
            'code': code,
            'message': DBError.messages[code],
            'info': info
        };
    }
}

module.exports = DBError
