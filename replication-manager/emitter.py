import time
import socket
import hashlib
import os
from globals import environ
import threading

def file_checksum(filename):
    with open(filename, 'rb') as f:
        bytes = f.read()
        readable_hash = hashlib.md5(bytes).hexdigest()
    return readable_hash

def print_file(filename):
    with open(filename, 'r') as f:
        print(f.read())
    pass

def get_lines(filename):
    lines = []
    num_lines = 0

    with open(filename, 'r') as f:
        lines = f.readlines()
        num_lines = len(lines)
    
    return lines, num_lines

def poll_last_modified(filename):
    last_modified = os.stat(filename).st_mtime_ns
    return last_modified

def send_new_log_entries(socket: socket.socket, host, port, new_lines: list):            
    for data in new_lines:
        socket.sendto(data.strip().encode('utf-8'), (host, port))
    
    # Wait for acknowledgement
    msg, addr = socket.recvfrom(1024)
    data = msg.decode('utf-8')
    print(f"Received data from {addr}: {data}")

    if data.startswith('ACK'):
        print(f"Replication successful\n")
    elif data.startswith('NACK'):

        backoff_time = 60
        max_tries = 5
        tries = 0

        while max_tries < tries:
            print(f"Replication unsuccessful, giving up after {max_tries - tries} try")
            
            time.sleep(backoff_time)
            
            tries += 1
            backoff_time *= 2
    else:
        print("Unknown response:", data)


def emitter(max_iterations=None):
    server_host_in = environ['SERVER_HOST_IN']
    host1 =  environ['SERVER_HOST_OUT'].split(';')[0]
    host2 = environ['SERVER_HOST_OUT'].split(';')[1]
    port1 = int(''.join(host1.split('.')[3:]))
    port2 = int(''.join(host2.split('.')[3:]))
    filename_to_monitor = '/root/log_files/Transaction.log'
    nodes = [(host1, int(port1)), (host2, int(port2))]

    # create sockets for each node
    sockets = [socket.socket(socket.AF_INET, socket.SOCK_DGRAM) for _ in nodes]

    # data = f'Sending from {server_host_in} to {host1}:{port1} and {host2}:{port2}'
    # print(data)
    # for sock, (host, port) in zip(sockets, nodes):
    #     sock.sendto(data.encode('utf-8'), (host, port))
    # current_socket_index = 0

    # get initial file size
    previous_last_modified = poll_last_modified(filename_to_monitor)
    _, last_line = get_lines(filename_to_monitor)

    # monitor file changes and replicate file data to the last node
    while True:

        try: 
            
            print(f"Monitoring {filename_to_monitor} for changes...")
            print(f"Last known hash: {previous_last_modified}")
            current_last_modified = poll_last_modified(filename_to_monitor)
            print(f"Current hash: {current_last_modified}")

            threads:list[threading.Thread] = []
            if current_last_modified != previous_last_modified:
                print(f"Detected change...")
                previous_last_modified = current_last_modified
                
                lines, _ = get_lines(filename_to_monitor)
                new_lines = lines[last_line:]
                

                for sock, (host, port) in zip(sockets, nodes):
                    thread = threading.Thread(
                        target=send_new_log_entries, args=[sock, host, port, new_lines])
                    threads.append(thread)

                for thread in threads:
                    thread.start()

            for thread in threads:
                thread.join()
            
        except KeyboardInterrupt:
            break
        
        time.sleep(1)

    # while max_iterations is None or iteration < max_iterations:

    #         for data in new_lines:
    #             for sock, (host, port) in zip(sockets, nodes):
    #                 sock.sendto(data.strip().encode('utf-8'), (host, port))

    #                 # ACK/NACK part
    #                 backoff_time = 1
    #                 max_backoff_time = 60

    #                 # Receive data from 2 clients
    #                 response_data = []
    #                 data, addr = sock.recvfrom(1024)
    #                 response_data.append((data.decode('utf-8'), addr))
    #                 print(f"Received data from {addr}: {data.decode('utf-8')}")

    #                 for response, addr in response_data:
    #                     while response.startswith('NACK') and backoff_time <= max_backoff_time:
    #                         print(f"Replication of {filename_to_monitor} unsuccessful, retrying in {backoff_time} seconds...")
    #                         time.sleep(backoff_time)
    #                         sock.sendto(data.encode('utf-8'), addr)
    #                         response = sock.recvfrom(1024).decode('utf-8')
    #                         backoff_time *= 2

    #                     if response.startswith('ACK'):
    #                         print(f"Replication of {filename_to_monitor} successful\n")
    #                     elif response.startswith('NACK'):
    #                         print(f"Replication of {filename_to_monitor} unsuccessful, giving up after {backoff_time//2} seconds")
    #                     else:
    #                         print("Unknown response:", response)
        
    #     time.sleep(1)
    #     iteration += 1

emitter()