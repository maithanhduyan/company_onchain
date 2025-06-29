# syntax=docker/dockerfile:1
FROM ubuntu:24.04

# Set non-interactive mode for apt
ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl build-essential pkg-config libssl-dev \
    libudev-dev ca-certificates git python3 python3-pip \
    sudo lsb-release && \
    apt-get install -y lsof && \
    apt-get install -y htop && \
    apt-get install -y --no-install-recommends \
    openssh-client jq libclang-dev && \
    rm -rf /var/lib/apt/lists/*

# Install Rust, Solana, Anchor, Node, Yarn
RUN curl --proto '=https' --tlsv1.2 -sSfL https://solana-install.solana.workers.dev | bash

# Set workdir
WORKDIR /workspace

# Default command
CMD ["bash"]
