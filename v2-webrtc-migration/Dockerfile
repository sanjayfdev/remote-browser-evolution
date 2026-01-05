FROM debian:12-slim

ENV DEBIAN_FRONTEND=noninteractive
ENV DISPLAY=:99

RUN apt-get update && apt-get install -y \
    chromium \
    xvfb \
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
    \
    python3 \
    python3-pip \
    python3-websockets \
    python3-gi \
    python3-gi-cairo \
    gir1.2-gstreamer-1.0 \
    gir1.2-gst-plugins-base-1.0 \
    gir1.2-gst-plugins-bad-1.0 \
    gstreamer1.0-plugins-bad \
    \
    gstreamer1.0-tools \
    gstreamer1.0-plugins-base \
    gstreamer1.0-plugins-good \
    gstreamer1.0-plugins-bad \
    gstreamer1.0-plugins-ugly \
    gstreamer1.0-libav \
    && rm -rf /var/lib/apt/lists/*  


WORKDIR /app

COPY backend ./backend
COPY frontend ./frontend
COPY docker/start.sh ./start.sh

RUN chmod +x start.sh

EXPOSE 3000 9000

CMD ["./start.sh"]
