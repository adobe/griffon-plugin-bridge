#!/bin/bash -e

export LOG=$(git log -1)
echo $LOG

if [[ $LOG == *"[skip ci]"* ]]
then
  echo "not running..."
  echo "<none> -- [skip ci] detected" >> .released-packages
else
  auth=$(curl -u${ARTIFACTORY_USER}:${ARTIFACTORY_API_TOKEN} https://artifactory.corp.adobe.com/artifactory/api/npm/npm-react-release/auth/nebula)

  export NPM_PASSWORD=$(echo "$auth" | grep "_password" | awk -F "=" '{print $2}')
  export NPM_USERNAME=$(echo "$auth" | grep "username" | awk -F "=" '{print $2}')
  export NPM_EMAIL=$(echo "$auth" | grep "email" | awk -F "=" '{print $2}')
  export NPM_AUTH=$(echo "$auth" | grep "_auth" | awk -F " " '{print $3}')

  npm config set cache /tmp

  eval `ssh-agent -s`
  scripts/deploy/addpass

  git config --global user.email "novaprj@adobe.com"
  git config --global user.name "novaprj"

  npm ci --unsafe-perm
  npm run build
  
  npx nova-semantic-release pre --mono
  git branch -u origin/master master

  npx nova-semantic-release perform --dontPush --mono
  git push --set-upstream origin master

  export RELEASED_PACKAGE=`cat .released-packages`
  echo $RELEASED_PACKAGE
fi
