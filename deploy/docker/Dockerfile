ARG BASEIMAGE=node:20-bookworm-slim

FROM ${BASEIMAGE}

EXPOSE 3000

RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /www

COPY . .

CMD [ "npm", "start" ]