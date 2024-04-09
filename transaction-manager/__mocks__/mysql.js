class Connection {

    records = {
        '0': {
            id: 0,
            region: 'Luzon',
            status: 'Queued',
            time_queued: new Date(),
            version: 0
        },
        '1': {
            id: 1,
            region: 'Visayas',
            status: 'Queued',
            time_queued: new Date(),
            version: 0
        },
        '2': {
            id: 2,
            region: 'Mindanao',
            status: 'Queued',
            time_queued: new Date(),
            version: 0
        }
    }

    connect(callback) {
        callback(false)
    }

    query(sql, keys, callback) {
        const tokens = sql.split(' ');
        const operation = tokens[0];

        switch (operation) {
            case 'SELECT':
                const id = tokens[tokens.length - 1];
                callback(false, this.records[id]);
                break;
        
            case 'INSERT':
                const region = tokens[tokens.length - 1];
                break;
            
            case 'UPDATE':

                break;

            default:
                break;
        }

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
