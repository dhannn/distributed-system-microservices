pkill -9 node
nohup node /root/microservices/src/app.js > /root/log_files/server.log

pkill -9 python3
nohup python3 -u emitter.py > /root/log_files/replication_emitter.log & disown

nohup python3 -u listener.py > /root/log_files/replication_listener.log & disown
