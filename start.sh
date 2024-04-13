#! /usr/bin/bash
# Start server
pkill -9 node
nohup node /root/microservices/src/app.js > /root/log_files/server.log & disown

# Start replication channels
pkill -9 python3
nohup python3 -u /root/microservices/replication-manager/emitter.py > /root/log_files/replication_emitter.log & disown
nohup python3 -u /root/microservices/replication-manager/listener.py > /root/log_files/replication_listener.log & disown

