# Please update your base container regularly for bug fixes and security patches.
# See https://git.corp.adobe.com/ASR/bbc-factory for the latest BBC releases.

FROM docker-asr-release.dr.corp.adobe.com/asr/nodejs_v10:1.4.0-alpine

ARG USER_ID
ARG GROUP_ID

RUN \
  echo https://mirror.csclub.uwaterloo.ca/alpine/v3.8/main > /etc/apk/repositories; \
  echo https://mirror.csclub.uwaterloo.ca/alpine/v3.8/community >> /etc/apk/repositories; \
  echo @edge https://mirror.csclub.uwaterloo.ca/alpine/edge/testing >> /etc/apk/repositories; \
  echo @edge_community https://mirror.csclub.uwaterloo.ca/alpine/edge/community >> /etc/apk/repositories; \
  echo @edge_main https://mirror.csclub.uwaterloo.ca/alpine/edge/main >> /etc/apk/repositories

RUN \
  apk update && \
  apk add --no-cache expect && \
  apk add --no-cache openssh && \
  apk add --no-cache chromium@edge && \
  mkdir /build

# This line is to tell karma-chrome-launcher where
# chromium was downloaded and installed to.
ENV CHROME_BIN /usr/bin/chromium-browser

# Tell Puppeteer to skip installing Chrome.
# We'll be using the installed package instead.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

# Create a jenkins user with same ID
RUN adduser -u $USER_ID -g $GROUP_ID -S jenkins

# Tell docker that all future commands should run as the jenkins user
USER jenkins

WORKDIR /build
