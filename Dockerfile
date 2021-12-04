FROM node:16.13.1

ENV NODE_ENV production

# Create app directory
WORKDIR /app

ADD README.md .
ADD package.json .
ADD yarn.lock .
ADD .yarnrc.yml .
ADD .yarn/releases .yarn/releases

ADD index.js .
ADD assets assets
ADD commands commands
ADD utils utils

ADD register_slash_commands.js .
RUN mv assets/register_slash_commands /usr/local/bin/register_slash_commands && chmod +x /usr/local/bin/register_slash_commands

RUN yarn set version berry && yarn set version berry
RUN yarn -v
RUN yarn

EXPOSE 3000

CMD [ "yarn", "start" ]
