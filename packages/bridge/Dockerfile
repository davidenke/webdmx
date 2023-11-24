FROM node:alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

RUN npm install -g typescript

COPY . .

RUN tsc

ENV DMX_UNIVERSE=dmx/universe/0
ENV OSC_HOST=localhost
ENV OSC_PORT=7770
ENV WS_PORT=8080

EXPOSE 8080

CMD ["node", "dist/bridge.js"]
