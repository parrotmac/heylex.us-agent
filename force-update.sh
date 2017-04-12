#!/bin/bash

cd /opt/heylex.us-agent/
git fetch --all
git reset --hard origin/master
sudo supervisorctl restart heylex-agent
