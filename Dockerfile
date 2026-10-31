FROM node:24-slim AS base
RUN npm i -g pnpm@12

FROM base AS builder
WORKDIR /app
COPY --chown=node:node package.json pnpm-*.yaml /app/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm i --frozen-lockfile
COPY --chown=node:node . /app/
RUN ["pnpm", "build"]

FROM builder AS runner
WORKDIR /app
COPY --from=builder /app/package.json /app/pnpm-*.yaml /app/
COPY --from=builder /app/dist /app/dist
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm i --prod --frozen-lockfile
EXPOSE 3000
USER node
HEALTHCHECK --interval=15s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/health').then((res) => process.exit(res.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["node", "dist/main"]
