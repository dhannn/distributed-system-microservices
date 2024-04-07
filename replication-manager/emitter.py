import time
import socket
import hashlib

def file_checksum(filename):
    with open(filename, 'rb') as f:
        bytes = f.read()
        readable_hash = hashlib.md5(bytes).hexdigest()
    return readable_hash

def emitter(nodes, filename_to_monitor):
    # create sockets for each node
    sockets = [socket.socket(socket.AF_INET, socket.SOCK_STREAM) for _ in nodes]

    # connect to nodes
    for sock, (host, port) in zip(sockets, nodes):
        sock.connect((host, port))
        
    current_socket_index = 0

    #get initial hash
    last_known_hash = file_checksum(filename_to_monitor)

    # monitor file changes and replicate file data to the last node
    while True:
        current_hash = file_checksum(filename_to_monitor)
        if current_hash != last_known_hash:
            last_known_hash = current_hash
            with open(filename_to_monitor, 'r') as file:
                data = file.read()

            sock = sockets[current_socket_index]
            sock.sendall(data.encode('utf-8'))
            current_socket_index = (current_socket_index + 1) % len(sockets)

            # ACK/NACK part
            response = sock.recv(1024).decode('utf-8')
            backoff_time = 1
            max_backoff_time = 60

            while response.startswith('NACK') and backoff_time <= max_backoff_time:
                print(f"Replication of {filename_to_monitor} unsuccessful, retrying in {backoff_time} seconds...")
                time.sleep(backoff_time)
                sock.sendall(data.encode('utf-8'))
                response = sock.recv(1024).decode('utf-8')
                backoff_time *= 2

            if response.startswith('ACK'):
                print(f"Replication of {filename_to_monitor} successful")
            elif response.startswith('NACK'):
                print(f"Replication of {filename_to_monitor} unsuccessful, giving up after {backoff_time//2} seconds")
            else:
                print("Unknown response:", response)
                        
        time.sleep(1)