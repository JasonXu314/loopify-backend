FROM node:16

RUN npm i -g yarn

WORKDIR /app

COPY package*.json ./

RUN yarn i

COPY . .

RUN node postinstall.js

RUN yarn build

ENV PORT=3000

EXPOSE 3000

CMD ["yarn", "start"]