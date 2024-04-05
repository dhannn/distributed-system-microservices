import mysql.connector
import os
transactions = {

}

# Once it received LSN + START, it will put the lsn key
# to transactions

transactions['001'] = []

# For every succeeding logs, we append to the list
transactions['001'] = [{
    'operation': 'INSERT',
    'id': '1',
    'args': ['03-29-2024', 'Luzon', 'Queued', '0']
    }]

# Once it received LSN + COMMIT/ABORT, 
# do the operation or not

""" 
    Saves & parses the transaction log from other emitters
"""
# raw transaction log input from the emitter
# call this 

class Transactions:
    transactions = {}

    def start(self, lsn):
        self.transactions[lsn] = []

    def add_operation(self, lsn, operation, id, args):
        db_operation = {
            'operation': operation,
            'id': id,
            'args': args
        }

        self.transactions[lsn].append(db_operation)

    def end(self, lsn, status):
        def convert_to_query(operation, id, args):
            if operation == 'INSERT':
                return f"INSERT INTO Appointments VALUES ({id}, {", ".join(args) });"
            elif operation == 'MODIFY':
                return f"UPDATE Appointments SET {args[0]} = {args[2]} WHERE id = {id};"
            else:
                raise 'Unsupported operation'

        if status == 'COMMIT':

            operations = transactions[lsn]
            query = ''            
            
            for operation in operations:
                query += convert_to_query(**operation)

            return query

class LogParser:
    def __init__(self, transactions: Transactions) -> None:
        self.transactions = transactions

    def parse(self, log):
        lsn, operation, args = log.split(' ')

        if operation == 'START':
            self.transactions.start(lsn)
        elif operation == 'COMMIT' or operation == 'ABORT':
            self.transactions.end(lsn, operation)
        elif operation == 'INSERT' or operation == 'MODIFY':
            self.transactions.add_operation(lsn, operation, args[0], args[1:])
        else: 
            raise Exception('Unsupported operation')

class Connection:

    db_connection = mysql.connector.MySQLConnection

    # Initialize database connection
    def __init__(self):
        self.db_connection = mysql.connector.connect(
            user=os.environ['DB_SERVER_USER'],
            password=os.environ['DB_SERVER_PASS'],
            host=os.environ['DB_SERVER_HOST'],
            port=os.environ['DB_SERVER_PORT'],
            database='SeriousMD'
        )
    
    def execute_query(self, query):
        is_success = True
        
        try:
            cursor = self.db_connection.cursor()
            cursor.execute(query)
            self.db_connection.commit()
        except:
            is_success = False
            self.db_connection.rollback()

        return is_success

