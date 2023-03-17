FROM node:current-alpine3.17
RUN apk update && apk upgrade
COPY package*.json ./

RUN addgroup -S slack-gpt && adduser -S slack-gpt -G slack-gpt
RUN mkdir -p /app && chown -R slack-gpt /app
WORKDIR /app
RUN npm install
EXPOSE 3000
COPY --chown=slack-gpt:slack-gpt . .
USER slack-gpt
CMD [ "npm", "start" ]
