FROM node:18-alpine as builder

ENV NODE_ENV build

WORKDIR /home/app

COPY package*.json ./
RUN npm ci

COPY --chown=node:node . .
RUN npm run build \
    && npm prune --production

# ---

FROM node:18-alpine

RUN apk add --no-cache tzdata
ENV TZ Asia/Phnom_Penh
ENV NODE_ENV production

USER node
WORKDIR /home/app

COPY --from=builder --chown=node:node /home/app/package*.json ./
COPY --from=builder --chown=node:node /home/app/node_modules/ ./node_modules/
COPY --from=builder --chown=node:node /home/app/dist/ ./dist/

CMD ["node", "dist/main.js"]
