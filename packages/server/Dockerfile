FROM node:18
RUN ln -snf /usr/share/zoneinfo/Asia/Seoul /etc/localtime
WORKDIR /app
COPY package*.json ./
RUN yarn install --production --network-timeout 1000000 
COPY . .
RUN yarn global add @nestjs/cli
RUN yarn build
EXPOSE 3000
CMD [ "node", "dist/main.js" ]