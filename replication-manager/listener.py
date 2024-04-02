import socket
import json
import os
import math
import sys

# assuming line by line reading of the file
# emitter sends "command" insert or update, send using JSON 
# send region
# if update also send id and status

def luzon_update(id, status):
    success = False
    luzon_host = '10.2.0.100'
    luzon_port = 3306  
    luzon_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        luzon_socket.connect((luzon_host, luzon_port))
        update_query = "UPDATE Appointments SET status = '{}' WHERE id = {}".format(status, id)
        luzon_socket.sendall(update_query.encode('utf-8'))
        print("Successful replication to luzon database")
        success = True
    except socket.error as e:
        print(str(e))
        print("Error connecting to replica database")
    finally:
        luzon_socket.close()

    if success:
        return "ACK"
    else:
        return "NACK"

def visMin_update(id, status):
    success = False
    visMin_host = '10.2.0.100'
    visMin_port = 3306  
    visMin_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        visMin_socket.connect((visMin_host, visMin_port))
        update_query = "UPDATE Appointments SET status = '{}' WHERE id = {}".format(status, id)
        visMin_socket.sendall(update_query.encode('utf-8'))
        print("Successful replication to luzon database")
        success = True
    except socket.error as e:
        print(str(e))
        print("Error connecting to replica database")
    finally:
        visMin_socket.close()

    if success:
        return "ACK"
    else:
        return "NACK"

def luzon_insert():
    success = False
    luzon_host = '10.2.0.101'
    luzon_port = 3306  
    luzon_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        luzon_socket.connect((luzon_host, luzon_port))
        insert_query = "INSERT INTO Appointments (region) VALUES (Luzon)"
        luzon_socket.sendall(insert_query.encode('utf-8'))
        print("Successful replication to luzon database")
        success = True
    except socket.error as e:
        print(str(e))
        print("Error connecting to replica database")
    finally:
        luzon_socket.close()

    if success:
        return "ACK"
    else:
        return "NACK"
    
def visMin_insert():
    success = False
    visMin_host = '10.2.0.100'
    visMin_port = 3306  
    visMin_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        visMin_socket.connect((visMin_host, visMin_port))
        insert_query = "INSERT INTO Appointments (region) VALUES (Luzon)"
        visMin_socket.sendall(insert_query.encode('utf-8'))
        print("Successful replication to luzon database")
        success = True
    except socket.error as e:
        print(str(e))
        print("Error connecting to replica database")
    finally:
        visMin_socket.close()

    if success:
        return "ACK"
    else:
        return "NACK"

def listener(host, port):
    res = {"res":"nan"}
    listener_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    # bind host and port
    try:
        listener_socket.bind((host, port))
    except socket.error as e:
        print(str(e))
        print("Error binding to host and port")
        sys.exit()
    try:
        while True:
            data, addr = socket.recvfrom(1024)	        
        
            try: 
                data = json.loads(data.decode('utf-8'))
            except:
                print("Invalid data received")

            cmd = data['cmd']
            region = data['region']

            if cmd == 'update':
                id = data['id']
                status = data['status']
                if region == 'luzon':
                    res["res"] = luzon_update(id, status)
                elif region == 'visMin':
                    res["res"] = visMin_update(id, status)
            elif cmd == 'insert':
                if region == 'luzon':
                    res["res"] = luzon_insert()
                elif region == 'visMin':
                    res["res"] = visMin_insert()
                
            jmsg = json.dumps(res).encode('utf-8')
            socket.sendto(jmsg, addr)

    except KeyboardInterrupt:
        print("Program terminated.")
        sys.exit(0)