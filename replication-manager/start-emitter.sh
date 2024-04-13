#! /usr/bin/bash
pkill -9 python3
nohup python3 -u emitter.py > /root/log_files/replication_emitter.log & disown
