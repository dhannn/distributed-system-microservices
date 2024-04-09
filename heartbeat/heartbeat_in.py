# Initialize socket endpoint
import logging
import os
import socket

from protocol import HeartbeatProtocol
from update_health import HealthUpdater

def listen_heartbeat():
    conn = HealthUpdater()
    # Initialize logging; get server host and port
    logging.basicConfig(level=logging.INFO)
    server_host_in = os.environ['SERVER_HOST_IN']
    server_port_in = int(''.join(server_host_in.split('.')[1:]))

    print(server_port_in)

    # Initialize socket endpoint
    endpoint = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    endpoint.bind((server_host_in, server_port_in))

    heartbeat_delay = float(os.environ['HEARTBEAT_DELAY'])
    TIMEOUT = heartbeat_delay * 2

    # Listen to publishers
    while True:
        try:
            endpoint.settimeout(TIMEOUT)
            message, _ = endpoint.recvfrom(1024)

            timestamp, host, status = HeartbeatProtocol.read(message)

            # Log publisher message
            logging.info(f'[{str(timestamp).zfill(20)}] Machine {host} is {status}')
            
            update_status = conn.execute_query(host, status)
            if update_status:
                print(f"Status of {host} updated to {status}")
            else:
                print(f"Failed to update status of {host}")

        except socket.timeout:
            logging.error('Heartbeat not received')
        except KeyboardInterrupt:
            break

listen_heartbeat()
