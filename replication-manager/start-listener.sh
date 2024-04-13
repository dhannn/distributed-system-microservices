#! /usr/bin/bash
pkill -9 python3
nohup python3 -u listener.py > /root/log_files/replication_listener.log & disown

