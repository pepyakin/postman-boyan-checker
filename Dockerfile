FROM ubuntu:14.04

RUN \
  apt-get update && \
  apt-get install -y libkyotocabinet-dev kyotocabinet-utils build-essential nodejs nodejs-dev npm && \
  ln -s `which nodejs` /usr/bin/node

VOLUME /data

RUN mkdir -p /app
WORKDIR /app

COPY package.json /app/
RUN npm install
COPY . /app/

EXPOSE 3000
ENTRYPOINT ["nodejs", "index.js"]
