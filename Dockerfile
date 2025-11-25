FROM node:25.2-alpine as build

WORKDIR /app

COPY package*.json ./
COPY .env .
COPY svelte.config.js .
COPY vite.config.ts .
COPY .prettierrc .
COPY eslint.config.js .
COPY tsconfig.json .

RUN npm install

COPY src ./src
COPY static ./static

RUN npm run build

FROM node:25.2-alpine

WORKDIR /app

COPY --from=build /app/build ./build
COPY --from=build /app/package*.json ./

RUN npm install --production

EXPOSE 3000

CMD ["node", "build/index.js"]
