FROM node:18

WORKDIR /usr/app

COPY package.json .

RUN npm i --quiet

COPY . .

EXPOSE 3006

RUN npm install pm2 -g

CMD ["pm2-runtime", "dist/index.js"]