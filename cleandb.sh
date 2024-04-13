#! /usr/bin/bash
mysql --execute='source sql/init.sql'
mysql --execute='source sql/trigger.sql'
