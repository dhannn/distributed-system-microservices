#! /usr/bin/bash
mysql --execute='USE SeriousMD; source sql/init.sql'
mysql --execute='USE SeriousMD; source sql/trigger.sql'
