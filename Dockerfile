FROM ubuntu:14.04

RUN \
  apt-get update && \
  apt-get install -y libkyotocabinet-dev kyotocabinet-utils build-essential nodejs nodejs-dev npm && \
  ln -s `which nodejs` /usr/bin/node

COPY . /app/postman-boyan-checker
WORKDIR /app/postman-boyan-checker
RUN npm install
ENTRYPOINT ['node', 'index.js']
