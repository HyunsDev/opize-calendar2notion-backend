FROM node:18
WORKDIR /app
COPY package*.json ./
RUN yarn install --production --network-timeout 1000000 
COPY . .
RUN yarn global add tsc tsc-alias
RUN yarn build
EXPOSE 3000
CMD [ "node", "dist/src/main.js" ]