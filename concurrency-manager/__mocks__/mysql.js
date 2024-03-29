class Connection {

    records = {
        '0': {
            version: 0
        },
        '1': {
            version: 1
        }
    }

    connect(callback) {
        callback(false)
    }

    query(_, keys, callback) {
        callback(false, [this.records[keys[0]]])
    }

    modify(key) {
        this.records[key].version += 1;
    }
}

function createConnection(_) {
    return new Connection();
}

module.exports = { createConnection }
