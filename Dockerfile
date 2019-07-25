FROM node:10

WORKDIR /usr/src/magenta-clientside
COPY package*.json ./
RUN npm install
# RUN npm ci --only=production

# TODO: copy only what's needed
COPY . .

EXPOSE 3000

CMD ["node", "dist/index.js"]
