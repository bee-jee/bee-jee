#!/bin/bash

export VUE_APP_API_URL=$VUE_STAGING_APP_API_URL
export VUE_APP_WS_URL=$VUE_STAGING_APP_WS_URL

npm run vue:build-staging

echo "${SFTP_KEY}" | base64 --decode > /tmp/beejee.pem
eval "$(ssh-agent -s)" # Start ssh-agent cache
chmod 600 /tmp/beejee.pem # Allow read access to the private key
ssh-add /tmp/beejee.pem # Add the private key to SSH

cd build
git init
git add -A
git commit -m "Deploy staging"
git push -f ssh://git@$SFTP_IP:22$SFTP_STAGING_FRONTEND_DEPLOY_DIR master
cd -

git config --global push.default matching
git remote add deploy ssh://git@$SFTP_IP:22$SFTP_STAGING_DEPLOY_DIR
git push -f deploy staging
