import logging
import os 
import time
import socket
import mysql.connector as connector

from protocol import HeartbeatProtocol

def emit_heartbeat():
    logging.basicConfig(level=logging.INFO)
    heartbeat_delay = os.environ['HEARTBEAT_DELAY']

    db_server_host = os.environ['DB_SERVER_HOST']
    db_server_port = int(os.environ['DB_SERVER_PORT'])
    db_server_user = os.environ['DB_SERVER_USER']
    db_server_pass = os.environ['DB_SERVER_PASS']
    server_host_out = os.environ['SERVER_HOST_OUT'].split(';')

    class Connection:
        def __init__(self, user, password, host, port) -> None:
            self.user = user
            self.password = password
            self.host = host
            self.port = port

        def is_connected(self):
            try:
                self.conn = connector.connect(user=self.user, password=self.password, host=self.host, port=self.port)
                return True
            except:
                return False

    class Subscriber:
        def __init__(self, dest_host, dest_port):
            self.dest_host = dest_host
            self.dest_port = dest_port
        
        def notify(self, message):
            connection = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            connection.sendto(message, (self.dest_host, self.dest_port))

    # Initialize subscribers
    subscribers = []
    for host in server_host_out:
        port = int(''.join(host.split('.')[1:]))
        subscribers.append(Subscriber(host, port))

    # Check the status of server
    conn = Connection(user=db_server_user, password=db_server_pass, host=db_server_host, port=db_server_port)

    while True:
        try:
            # Compose message based on protocol
            status = 'ALIVE' if conn.is_connected() else 'DEAD'
            timestamp = time.time()
            message = HeartbeatProtocol.write(timestamp, db_server_host, status)

            if status == 'DEAD':
                logging.critical(f'[{timestamp}] { db_server_host } is DEAD')

            # Notify subscribers
            for subscriber in subscribers:
                subscriber: Subscriber
                subscriber.notify(message)
                logging.info(f'[{str(timestamp).zfill(20)}] {subscriber.dest_host} is notified.')

            
            time.sleep(heartbeat_delay)
        
        except KeyboardInterrupt:
            break

emit_heartbeat()
