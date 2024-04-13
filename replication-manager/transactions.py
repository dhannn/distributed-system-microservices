import mysql.connector
import os

class Transactions:
    transactions = {}

    def start(self, lsn):
        self.transactions[lsn] = []

    def add_operation(self, lsn, operation, args):
        db_operation = {
            'operation': operation,
            'id': args[0],
            'args': args[1:]
        }
        print('FGSHJKA')
        print(db_operation)

        self.transactions[lsn].append(db_operation)

    def end(self, lsn, status, *_):

        def convert_to_query(operation, id, args):
            if operation == 'INSERT':
                return f"INSERT INTO Appointments VALUES ({id}, {', '.join(args) });"
            elif operation == 'MODIFY':
                return f"UPDATE Appointments SET {args[0]} = {args[1]} WHERE id = {id};"
            else:
                raise 'Unsupported operation'

        if status == 'COMMIT':

            operations = self.transactions[lsn]
            query = ''
            print(operations)
            
            for operation in operations:
                query += convert_to_query(**operation)
            
            return query

class LogParser:
    @staticmethod
    def parse(log):
        lsn, operation, *args = log.split(' ')

        return lsn, operation, args

class Connection:

    db_connection = mysql.connector.MySQLConnection

    def __init__(self):
        
        try:
            self.db_connection = mysql.connector.connect(
                user=os.environ['DB_SERVER_USER'],
                password=os.environ['DB_SERVER_PASS'],
                host=os.environ['DB_SERVER_HOST'],
                port=os.environ['DB_SERVER_PORT'],
                database='SeriousMD'
            )
        except Exception as e:
            raise e
    
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

