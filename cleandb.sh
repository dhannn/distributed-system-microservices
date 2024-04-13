#! /usr/bin/bash
pkill -9 node

mysql --execute='USE SeriousMD' < sql/init.sql
mysql --execute='USE SeriousMD' < sql/trigger.sql
