FROM debian:bookworm-slim

# --------------------------
# Environment
# --------------------------
ENV DEBIAN_FRONTEND=noninteractive
ENV DISPLAY=:99

# --------------------------
# System dependencies
# --------------------------
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    curl \
    xvfb \
    ffmpeg \
    dumb-init \
    fonts-liberation \
    libnss3 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    libx11-xcb1 \
    libxcomposite1 \
    libxrandr2 \
    libxdamage1 \
    libxkbcommon0 \
    libasound2 \
    libgbm1 \
    libdrm2 \
    && rm -rf /var/lib/apt/lists/*

# --------------------------
# Google Chrome (stable)
# --------------------------
RUN wget -qO- https://dl.google.com/linux/linux_signing_key.pub | \
    gpg --dearmor -o /usr/share/keyrings/chrome.gpg && \
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/chrome.gpg] http://dl.google.com/linux/chrome/deb/ stable main" \
    > /etc/apt/sources.list.d/google-chrome.list && \
    apt-get update && \
    apt-get install -y google-chrome-stable && \
    rm -rf /var/lib/apt/lists/*

# --------------------------
# Node.js LTS
# --------------------------
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs

# --------------------------
# App
# --------------------------
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# --------------------------
# Entrypoint
# --------------------------
RUN chmod +x /app/docker-entrypoint.sh

ENTRYPOINT ["dumb-init", "--"]
CMD ["/app/docker-entrypoint.sh"]
