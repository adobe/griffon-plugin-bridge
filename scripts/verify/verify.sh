#!/bin/bash -e

auth=$(curl -u${ARTIFACTORY_USER}:${ARTIFACTORY_API_TOKEN} https://artifactory.corp.adobe.com/artifactory/api/npm/npm-react-release/auth/nebula)

export NPM_PASSWORD=$(echo "$auth" | grep "_password" | awk -F "=" '{print $2}')
export NPM_USERNAME=$(echo "$auth" | grep "username" | awk -F "=" '{print $2}')
export NPM_EMAIL=$(echo "$auth" | grep "email" | awk -F "=" '{print $2}')
export NPM_AUTH=$(echo "$auth" | grep "_auth" | awk -F " " '{print $3}')

npm config set cache /tmp

npm ci --unsafe-perm
npm run build
npm run lint
npm run test:ci
