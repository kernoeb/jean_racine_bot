FROM node:16.10.0

# Create app directory
WORKDIR /app
ADD . /app/

RUN yarn set version berry && yarn set version berry
RUN yarn

ENV NODE_ENV production

EXPOSE 3000

CMD [ "yarn", "start" ]
