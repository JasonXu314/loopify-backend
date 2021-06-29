FROM node:16

WORKDIR /app

COPY package.json ./
COPY yarn.lock ./

RUN yarn install

COPY . .

RUN node postinstall.js

RUN yarn build

ENV PORT=3000

EXPOSE 3000

CMD ["yarn", "start"]