FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
COPY server/package.json ./server/
RUN npm ci --workspace=server --omit=dev

FROM base AS build
COPY package.json package-lock.json ./
COPY server/package.json ./server/
RUN npm ci --workspace=server
COPY server/tsconfig.json ./server/
COPY server/prisma ./server/prisma
RUN cd server && npx prisma generate
COPY server/src ./server/src
RUN cd server && npx tsc

FROM base AS runner
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/server/dist ./dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY server/prisma ./prisma
COPY server/package.json ./package.json

ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "dist/index.js"]
