FROM node:16.18.1-slim
RUN apt-get update  \
    && apt-get install --no-install-recommends --no-install-suggests -y ca-certificates  \
    && apt-get install --no-install-recommends --no-install-suggests --reinstall -y fontconfig

ENV NODE_ENV production
WORKDIR /app

COPY --chown=node:node package.json yarn.lock .yarnrc.yml /app/
COPY --chown=node:node .yarn/cache/ /app/.yarn/cache/
COPY --chown=node:node .yarn/releases/ /app/.yarn/releases/
RUN yarn install --immutable --immutable-cache --check-cache

COPY --chown=node:node index.js /app/index.js
COPY --chown=node:node register_slash_commands.js /app/register_slash_commands.js
COPY --chown=node:node assets/ /app/assets/
COPY --chown=node:node commands/ /app/commands/
COPY --chown=node:node utils/ /app/utils/
RUN mv assets/register_slash_commands /usr/local/bin/register_slash_commands && chmod +x /usr/local/bin/register_slash_commands

USER node
EXPOSE 3000

CMD [ "yarn", "start" ]
