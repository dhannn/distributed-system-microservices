import time
import socket
import hashlib
import os
from globals import environ

def file_checksum(filename):
    with open(filename, 'rb') as f:
        bytes = f.read()
        readable_hash = hashlib.md5(bytes).hexdigest()
    return readable_hash

def print_file(filename):
    with open(filename, 'r') as f:
        print(f.read())
    pass

def poll_last_modified(filename):
    last_modified = os.stat(filename).st_mtime_ns
    return last_modified

def emitter(max_iterations=None):
    server_host_in = environ['SERVER_HOST_IN']
    host1 =  environ['SERVER_HOST_OUT'].split(';')[0]
    host2 = environ['SERVER_HOST_OUT'].split(';')[1]
    port1 = int(''.join(host1.split('.')[3:])) + 10
    port2 = int(''.join(host2.split('.')[3:])) + 10
    filename_to_monitor = '/root/log_files/Transaction.log'
    print_file(filename_to_monitor)
    nodes = [(host1, int(port1)), (host2, int(port2))]

    # create sockets for each node
    sockets = [socket.socket(socket.AF_INET, socket.SOCK_DGRAM) for _ in nodes]

    data = f'Sending from {server_host_in} to {host1}:{port1} and {host2}:{port2}'
    print(data)
    for sock, (host, port) in zip(sockets, nodes):
        sock.sendto(data.encode('utf-8'), (host, port))
    # current_socket_index = 0

    #get initial file size
    last_known_hash = file_checksum(filename_to_monitor)

    # monitor file changes and replicate file data to the last node
    iteration = 0
    while max_iterations is None or iteration < max_iterations:
        print(f"Monitoring {filename_to_monitor} for changes...")
        print(f"Last known hash: {last_known_hash}")
        current_hash = file_checksum(filename_to_monitor)
        print(f"Current hash: {current_hash}")
        if current_hash != last_known_hash:
            print(f"Detected change...")
            last_known_hash = current_hash
            with open(filename_to_monitor, 'r') as file:
                data = file.read()

            for sock, (host, port) in zip(sockets, nodes):
                sock.sendto(data.encode('utf-8'), (host, port))

            # ACK/NACK part
            backoff_time = 1
            max_backoff_time = 60

            # Receive data from 2 clients
            response_data = []
            for _ in range(2):
                data, addr = sock.recvfrom(1024)
                response_data.append((data.decode('utf-8'), addr))
                print(f"Received data from {addr}: {data.decode('utf-8')}")

            for response, addr in response_data:
                while response.startswith('NACK') and backoff_time <= max_backoff_time:
                    print(f"Replication of {filename_to_monitor} unsuccessful, retrying in {backoff_time} seconds...")
                    time.sleep(backoff_time)
                    sock.sendto(data.encode('utf-8'), addr)
                    response = sock.recvfrom(1024).decode('utf-8')
                    backoff_time *= 2

                if response.startswith('ACK'):
                    print(f"Replication of {filename_to_monitor} successful\n")
                elif response.startswith('NACK'):
                    print(f"Replication of {filename_to_monitor} unsuccessful, giving up after {backoff_time//2} seconds")
                else:
                    print("Unknown response:", response)
        
        time.sleep(1)
        iteration += 1

emitter()