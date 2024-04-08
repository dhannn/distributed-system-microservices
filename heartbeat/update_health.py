import os

import mysql.connector

class HealthUpdater:
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
            print(e)
    
    def execute_query(self, node, status):
        is_success = True
        query = f"UPDATE SystemHealth SET node_status = '{status}' WHERE node_number = '{node}'"

        try:
            cursor = self.db_connection.cursor()
            cursor.execute(query)
            self.db_connection.commit()
        except:
            is_success = False
            self.db_connection.rollback()

        return is_success
