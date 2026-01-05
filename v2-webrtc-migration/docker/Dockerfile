FROM debian:bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive
ENV DISPLAY=:99

# Install all dependencies
RUN apt-get update && apt-get install -y \
    # Node.js
    curl \
    gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    # X11 and Chromium
    xvfb \
    x11vnc \
    chromium \
    chromium-driver \
    # Input simulation
    xdotool \
    xserver-xephyr \
    # GStreamer for WebRTC
    gstreamer1.0-tools \
    gstreamer1.0-plugins-base \
    gstreamer1.0-plugins-good \
    gstreamer1.0-plugins-bad \
    gstreamer1.0-plugins-ugly \
    gstreamer1.0-libav \
    gstreamer1.0-nice \
    gstreamer1.0-x \
    libgstreamer1.0-dev \
    libnice10 \
    # Utils
    supervisor \
    procps \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy application files
COPY backend/package.json backend/package-lock.json ./backend/
COPY docker/entrypoint.sh /entrypoint.sh

# Install Node.js dependencies
WORKDIR /app/backend
RUN npm install

# Copy backend code
COPY backend/ ./

RUN chmod +x /entrypoint.sh

EXPOSE 3000

WORKDIR /app/backend
CMD ["/entrypoint.sh"]