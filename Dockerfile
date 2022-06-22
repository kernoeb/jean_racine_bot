FROM node:16.15.1

ENV NODE_ENV production

# Create app directory
WORKDIR /app

ADD README.md .
ADD package.json .
ADD yarn.lock .
ADD .yarnrc.yml .
ADD .yarn/cache .yarn/cache
ADD .yarn/releases .yarn/releases

# Note : we use yarn pnp here to install dependencies
RUN yarn

ADD index.js .
ADD assets assets
ADD commands commands
ADD utils utils

ADD register_slash_commands.js .
RUN mv assets/register_slash_commands /usr/local/bin/register_slash_commands && chmod +x /usr/local/bin/register_slash_commands

EXPOSE 3000

CMD [ "yarn", "start" ]
