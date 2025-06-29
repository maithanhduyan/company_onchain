# syntax=docker/dockerfile:1
FROM ubuntu:24.04

# Set non-interactive mode for apt
ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl build-essential pkg-config libssl-dev \
    libudev-dev ca-certificates git python3 python3-pip \
    nodejs npm yarn \
    sudo lsb-release && \
    apt-get install -y lsof && \
    apt-get install -y htop && \
    apt-get install -y --no-install-recommends \
    openssh-client jq libclang-dev && \
    rm -rf /var/lib/apt/lists/*

# Install Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Install Solana CLI
RUN sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
ENV PATH="/root/.local/share/solana/install/active_release/bin:${PATH}"

# Install Anchor CLI (via AVM)
RUN cargo install --git https://github.com/coral-xyz/anchor avm --force && \
    avm install latest && \
    avm use latest

# Set workdir
WORKDIR /workspace

# Default command
CMD ["bash"]
