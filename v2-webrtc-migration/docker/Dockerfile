FROM debian:12-slim

ENV DEBIAN_FRONTEND=noninteractive
ENV DISPLAY=:99

RUN apt-get update && apt-get install -y \
    chromium \
    xvfb \
    # fluxbox \
    x11vnc \
    novnc \
    websockify \
    dbus-x11 \
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
    ca-certificates \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend ./backend
COPY docker/start.sh ./start.sh

RUN chmod +x start.sh

EXPOSE 3000 6080

CMD ["./start.sh"]
