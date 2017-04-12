#!/usr/bin/env bash

SCRIPT_PATH=$(readlink -f "$0")

cd /opt/heylex.us-agent/

# Store info about updater and supervisord config
INITIAL_UPDATER_HASH=$(shasum force-update.sh)
INITIAL_SUPERVISOR_HASH=$(shasum heylex-agent.conf)

# If we're up to date, then don't do anything
REMOTE_REPO_REVISION=$(git rev-parse origin/master)
LOCAL_REPO_REVISION=$(git rev-parse HEAD)
if [ "$REMOTE_REPO_REVISION" == "$LOCAL_REPO_REVISION" ]; then
    exit
fi

# There are upstream changes
# Stomp over any local changes
git fetch --all
git reset --hard origin/master

# If this script was updated, we'll switch to the new version
UPDATED_UPDATER_HASH=$(shasum force-update.sh)
if [ "$INITIAL_UPDATER_HASH" != "$UPDATED_UPDATER_HASH" ]; then
    exec "$SCRIPT_PATH"
fi

# Reload config if Supervisor service definition was updated
UPDATED_SUPERVISOR_HASH=$(shasum heylex-agent.conf)
if [ "$INITIAL_SUPERVISOR_HASH" != "$UPDATED_SUPERVISOR_HASH" ]; then
    sudo cp heylex-agent.conf /etc/supervisor/conf.d/heylex-agent.conf
    sudo supervisorctl reload heylex-agent
fi


# Ensure Node deps are taken care of
npm install

# Restart our service now that repo has been updated
sudo supervisorctl restart heylex-agent
