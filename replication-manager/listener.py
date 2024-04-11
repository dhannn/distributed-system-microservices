import socket
import sys
from globals import environ
from transactions import *

def listener():
    server_host_in = environ['SERVER_HOST_IN']
    server_port_in = int(''.join(server_host_in.split('.')[3:]))
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

    listener_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    # bind host and port
    try:
        listener_socket.bind((server_host_in, server_port_in))
        print(f"Listening on {server_host_in}:{server_port_in}")
    except socket.error as e:
        print(str(e))
        print("Error binding to host and port")
        sys.exit()
    
    try:
        while True:
            data, addr = listener_socket.recvfrom(1024)
            data = data.decode('utf-8')
            print(f"Received data from {addr}: {data}")

            data, addr = listener_socket.recvfrom(1024)
            data = data.decode('utf-8')
            print(f"Received another data from {addr}: {data}")
            ret = parser.parse(data)

            try:
                query = _dict[ret[1]](*ret)
                if query is not None:
                    conn.execute_query(query)
            except Exception as e:
                print(f"Exception occurred: {e}")
                listener_socket.sendto(f'NACK {e}'.encode('utf-8'), addr)

            # listener_socket.close()  # Move this outside the while loop
    except KeyboardInterrupt:
        print("Program terminated.")
        sys.exit(0)
    finally:
        listener_socket.close()
    
listener()
