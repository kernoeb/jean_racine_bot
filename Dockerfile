FROM node:16.8.0

# Create app directory
WORKDIR /app
ADD . /app/

RUN yarn

ENV NODE_ENV production

EXPOSE 3000

CMD [ "yarn", "start" ]
