## Dockerfile for building the bridge on arm32v7/debian

FROM arm32v7/debian

RUN apt-get update && apt-get install -y curl build-essential

RUN curl https://sh.rustup.rs -sSf | sh -s -- -y

ENV PATH="/root/.cargo/bin:${PATH}"

RUN rustup target add armv7-unknown-linux-gnueabihf

RUN apt-get install -y openssl libssl-dev pkg-config

WORKDIR /usr/src/bridge
