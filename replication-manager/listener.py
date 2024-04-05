import socket
import sys

import mysql.connector
from transactions import *

def listener(host, port):
    listener_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    transactions = Transactions()
    parser = LogParser()
    conn = Connection()

    _dict = {
        'START': transactions.start,
        'COMMIT': transactions.end,
        'ABORT': transactions.end,
        'INSERT': transactions.add_operation,
        'MODIFY': transactions.add_operation,
    }

    # bind host and port
    try:
        listener_socket.bind((host, port))
    except socket.error as e:
        print(str(e))
        print("Error binding to host and port")
        sys.exit()
    
    try:
        while True:
            data, addr = listener_socket.recvfrom(1024)
            ret = parser.parse(data)

            try:
                query = _dict(ret[1])(*ret)
                if query is not None:
                    conn.execute_query(query)
            except Exception as e:
                listener_socket.send(f'NACK {e}'.encode('utf-8'))


    except KeyboardInterrupt:
        print("Program terminated.")
        sys.exit(0)
