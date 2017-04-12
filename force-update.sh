#!/bin/bash

cd /opt/heylex.us-agent/

INITIAL_UPDATER_HASH=$(shasum force-update.sh)
INITIAL_SUPERVISOR_HASH=$(shasum heylex-agent.conf)

git fetch --all
git reset --hard origin/master

UPDATED_UPDATER_HASH=$(shasum force-update.sh)
UPDATED_SUPERVISOR_HASH=$(shasum heylex-agent.conf)

if [ "$INITIAL_UPDATER_HASH" != "$UPDATED_UPDATER_HASH" ]; then
    setsid force-update.sh &
    exit
fi

if [ "$INITIAL_SUPERVISOR_HASH" != "$UPDATED_SUPERVISOR_HASH" ]; then
    sudo cp heylex-agent.conf /etc/supervisor/conf.d/heylex-agent.conf
    sudo supervisorctl reload heylex-agent
fi

echo "Caramel Frappuccino"

npm install
sudo supervisorctl restart heylex-agent
