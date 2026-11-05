# ============================================================
# Dockerfile for Azeem Mart - Railway Deployment
# Multi-stage build: build stage + runtime stage
# ============================================================

# ---- Build Stage ----
FROM ubuntu:22.04 AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    git \
    curl \
    zip \
    unzip \
    tar \
    pkg-config \
    libssl-dev \
    libpq-dev \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install vcpkg
RUN git clone --depth 1 https://github.com/microsoft/vcpkg.git /opt/vcpkg \
    && /opt/vcpkg/bootstrap-vcpkg.sh

ENV VCPKG_ROOT=/opt/vcpkg
ENV PATH="${VCPKG_ROOT}:${PATH}"

# Install Drogon and dependencies via vcpkg
# Note: port is 'libpq', not 'postgresql'
RUN vcpkg install drogon libpq --triplet=x64-linux

# Set working directory
WORKDIR /app

# Copy source files
COPY . .

# Build the application
RUN cmake -B build -S . \
    -DCMAKE_TOOLCHAIN_FILE=/opt/vcpkg/scripts/buildsystems/vcpkg.cmake \
    -DVCPKG_TARGET_TRIPLET=x64-linux \
    -DCMAKE_BUILD_TYPE=Release \
    && cmake --build build --config Release -j$(nproc)

# ---- Runtime Stage ----
FROM ubuntu:22.04 AS runtime

# Install runtime dependencies only
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    libssl3 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1000 appuser

WORKDIR /app

# Copy built executable and config from builder
COPY --from=builder /app/build/sri_mart .
COPY --from=builder /app/config ./config

# Change ownership to appuser
RUN chown -R appuser:appuser /app

USER appuser

# Expose port (Railway will set PORT env var)
EXPOSE 8080

# Run the application
CMD ["./sri_mart"]