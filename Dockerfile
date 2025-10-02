# Build stage
FROM node:18-alpine AS builder
WORKDIR /app

COPY package.json yarn.lock .yarnrc.yml ./

RUN corepack enable \
  && corepack prepare yarn@4.9.4 --activate \
  && yarn install --immutable

COPY . .

RUN yarn build

# Production stage
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/yarn.lock ./yarn.lock
COPY --from=builder /app/.yarnrc.yml ./.yarnrc.yml
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/server ./server
COPY --from=builder /app/utils ./utils
COPY --from=builder /app/assets ./assets
COPY --from=builder /app/public ./public
COPY --from=builder /app/components ./components
COPY --from=builder /app/layouts ./layouts
COPY --from=builder /app/composables ./composables
COPY --from=builder /app/pages ./pages
COPY --from=builder /app/middleware ./middleware
COPY --from=builder /app/types ./types
COPY --from=builder /app/app.vue ./app.vue
COPY --from=builder /app/nuxt.config.ts ./nuxt.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json

RUN mkdir -p /app/data/uploads

RUN yarn migrate

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
