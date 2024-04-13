#! /usr/bin/bash
mysql --execute='USE SeriousMD' < sql/init.sql
mysql --execute='USE SeriousMD' < sql/trigger.sql
