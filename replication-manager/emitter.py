import time
import socket
import hashlib

def file_checksum(filename):
    with open(filename, 'rb') as f:
        bytes = f.read()
        readable_hash = hashlib.md5(bytes).hexdigest()
    return readable_hash

def emitter(nodes, files_to_monitor):
    # create sockets for each node
    sockets = [socket.socket(socket.AF_INET, socket.SOCK_STREAM) for _ in nodes]

    # connect to nodes
    for sock, (host, port) in zip(sockets, nodes):
        sock.connect((host, port))

    # get initial file hashes
    last_known_hashes = {filename: file_checksum(filename) for filename in files_to_monitor}

    # monitor file changes and replicate file data to other nodes
    while True:
        for filename in files_to_monitor:
            current_hash = file_checksum(filename)
            if current_hash != last_known_hashes[filename]:
                last_known_hashes[filename] = current_hash
                with open(filename, 'r') as file:
                    data = file.read()

                for sock in sockets:
                    sock.sendall(data.encode('utf-8'))

                    # ACK/NACK part
                    response = sock.recv(1024).decode('utf-8')
                    backoff_time = 1
                    max_backoff_time = 60

                    while response.startswith('NACK') and backoff_time <= max_backoff_time:
                        print(f"Replication of {filename} unsuccessful, retrying in {backoff_time} seconds...")
                        time.sleep(backoff_time)
                        sock.sendall(data.encode('utf-8'))
                        response = sock.recv(1024).decode('utf-8')
                        backoff_time *= 2

                    if response.startswith('ACK'):
                        print(f"Replication of {filename} successful")
                    elif response.startswith('NACK'):
                        print(f"Replication of {filename} unsuccessful, giving up after {backoff_time//2} seconds")
                    else:
                        print("Unknown response:", response)
                        
        time.sleep(1)