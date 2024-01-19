ARG BASEIMAGE=node:20-bookworm-slim

FROM ${BASEIMAGE}

EXPOSE 3000

RUN sed -i 's/deb.debian.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apt/sources.list.d/debian.sources

RUN apt-get update && apt-get install -y openssl

WORKDIR /www

COPY . .

CMD [ "npm", "start" ]