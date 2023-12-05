FROM node:20.10.0

WORKDIR /app/customers

COPY package.json .
RUN npm install

COPY . .

EXPOSE 8001

CMD [ "npm","start" ]