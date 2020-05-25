#!/bin/bash

eval "$(ssh-agent -s)" # Start ssh-agent cache
chmod 600 /tmp/beejee.pem # Allow read access to the private key
ssh-add /tmp/beejee.pem # Add the private key to SSH

git config --global push.default matching
git remote add deploy ssh://git@$SFTP_IP:22$SFTP_DEPLOY_DIR
git push deploy master
