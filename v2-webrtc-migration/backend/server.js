const express = require('express');
const WebSocket = require('ws');
const { spawn } = require('child_process');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const PORT = 3000;
const WS_PORT = 8080;

// Store active browser and streaming processes
let chromiumProcess = null;
let gstreamerProcess = null;
let currentUrl = 'about:blank';

// WebSocket server for signaling
const wss = new WebSocket.Server({ port: WS_PORT });
const clients = new Set();

console.log('🚀 Starting Browser Streaming Server...');

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('📱 Client connected');
  clients.add(ws);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('📨 Received:', data.type);

      // Broadcast to all other clients (for WebRTC signaling)
      clients.forEach(client => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(message.toString());
        }
      });
    } catch (error) {
      console.error('❌ Message error:', error);
    }
  });

  ws.on('close', () => {
    console.log('📱 Client disconnected');
    clients.delete(ws);
  });

  // Send initial status
  ws.send(JSON.stringify({
    type: 'status',
    browserRunning: chromiumProcess !== null,
    currentUrl: currentUrl
  }));
});

// ============================================
// API ENDPOINTS
// ============================================

// Start browser and streaming
app.post('/api/start', (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  console.log(`🌐 Starting browser with URL: ${url}`);
  currentUrl = url;

  // Kill existing processes
  if (chromiumProcess) {
    chromiumProcess.kill('SIGTERM');
    chromiumProcess = null;
  }
  if (gstreamerProcess) {
    gstreamerProcess.kill('SIGTERM');
    gstreamerProcess = null;
  }

  // Start Chromium
  chromiumProcess = spawn('chromium', [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-software-rasterizer',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1920,1080',
    '--window-position=0,0',
    '--start-maximized',
    '--kiosk',
    '--user-data-dir=/tmp/chrome-profile',
    url
  ], {
    env: { ...process.env, DISPLAY: ':99' },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  chromiumProcess.stdout.on('data', (data) => {
    console.log(`Chromium: ${data}`);
  });

  chromiumProcess.stderr.on('data', (data) => {
    // Ignore common warnings
    const message = data.toString();
    if (!message.includes('DevTools') && !message.includes('extension')) {
      console.error(`Chromium: ${message}`);
    }
  });

  chromiumProcess.on('exit', (code) => {
    console.log(`Chromium exited with code ${code}`);
    chromiumProcess = null;
  });

  // Wait for browser to start, then start streaming
  setTimeout(() => {
    startGStreamerStream();
  }, 2000);

  // Broadcast to all WebSocket clients
  broadcastToClients({
    type: 'browser_started',
    url: url
  });

  res.json({ 
    success: true, 
    message: 'Browser started',
    url: url 
  });
});

// Stop browser
app.post('/api/stop', (req, res) => {
  console.log('🛑 Stopping browser...');

  if (chromiumProcess) {
    chromiumProcess.kill('SIGTERM');
    chromiumProcess = null;
  }
  if (gstreamerProcess) {
    gstreamerProcess.kill('SIGTERM');
    gstreamerProcess = null;
  }

  broadcastToClients({
    type: 'browser_stopped'
  });

  res.json({ success: true, message: 'Browser stopped' });
});

// Send mouse click
app.post('/api/click', (req, res) => {
  const { x, y } = req.body;

  if (!x || !y) {
    return res.status(400).json({ error: 'x and y coordinates required' });
  }

  console.log(`🖱️ Click at (${x}, ${y})`);

  const xdotool = spawn('xdotool', [
    'mousemove', '--sync', x.toString(), y.toString(),
    'click', '1'
  ], {
    env: { ...process.env, DISPLAY: ':99' }
  });

  xdotool.on('exit', (code) => {
    if (code === 0) {
      res.json({ success: true, x, y });
    } else {
      res.status(500).json({ error: 'Click failed' });
    }
  });
});

// Send keyboard input
app.post('/api/type', (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'text required' });
  }

  console.log(`⌨️ Typing: ${text}`);

  const xdotool = spawn('xdotool', [
    'type', '--clearmodifiers', '--delay', '50', text
  ], {
    env: { ...process.env, DISPLAY: ':99' }
  });

  xdotool.on('exit', (code) => {
    if (code === 0) {
      res.json({ success: true, text });
    } else {
      res.status(500).json({ error: 'Type failed' });
    }
  });
});

// Send key press
app.post('/api/key', (req, res) => {
  const { key } = req.body;

  if (!key) {
    return res.status(400).json({ error: 'key required' });
  }

  console.log(`⌨️ Key press: ${key}`);

  const xdotool = spawn('xdotool', [
    'key', '--clearmodifiers', key
  ], {
    env: { ...process.env, DISPLAY: ':99' }
  });

  xdotool.on('exit', (code) => {
    if (code === 0) {
      res.json({ success: true, key });
    } else {
      res.status(500).json({ error: 'Key press failed' });
    }
  });
});

// Get status
app.get('/api/status', (req, res) => {
  res.json({
    browserRunning: chromiumProcess !== null,
    streamingActive: gstreamerProcess !== null,
    currentUrl: currentUrl,
    clients: clients.size
  });
});

// ============================================
// GSTREAMER WEBRTC STREAMING
// ============================================

function startGStreamerStream() {
  console.log('🎥 Starting GStreamer WebRTC stream...');

  // GStreamer pipeline for capturing X11 and streaming via WebRTC
  const pipeline = [
    'gst-launch-1.0',
    '-v',
    // Capture X display
    'ximagesrc', 'display-name=:99', 'use-damage=false', 'show-pointer=true', '!',
    // Set framerate
    'video/x-raw,framerate=30/1', '!',
    // Convert and scale
    'videoscale', '!',
    'video/x-raw,width=1920,height=1080', '!',
    'videoconvert', '!',
    // Encode to H.264 (better than VP8 for quality)
    'x264enc', 'tune=zerolatency', 'bitrate=4000', 'speed-preset=superfast', '!',
    'video/x-h264,profile=baseline', '!',
    'rtph264pay', 'config-interval=1', 'pt=96', '!',
    // Queue
    'queue', '!',
    // Output to stdout (we'll handle WebRTC in Node.js)
    'fdsink', 'fd=1'
  ];

  gstreamerProcess = spawn(pipeline[0], pipeline.slice(1), {
    env: { ...process.env, DISPLAY: ':99' },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let streamData = Buffer.alloc(0);

  gstreamerProcess.stdout.on('data', (chunk) => {
    streamData = Buffer.concat([streamData, chunk]);
    
    // Send chunks to WebSocket clients
    if (streamData.length > 4096) {
      broadcastToClients({
        type: 'video_data',
        data: streamData.toString('base64')
      });
      streamData = Buffer.alloc(0);
    }
  });

  gstreamerProcess.stderr.on('data', (data) => {
    const message = data.toString();
    // Only log important messages
    if (message.includes('ERROR') || message.includes('WARNING')) {
      console.error(`GStreamer: ${message}`);
    }
  });

  gstreamerProcess.on('exit', (code) => {
    console.log(`GStreamer exited with code ${code}`);
    gstreamerProcess = null;
  });

  console.log('✓ GStreamer stream started');
}

// Broadcast message to all WebSocket clients
function broadcastToClients(message) {
  const data = JSON.stringify(message);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

// Start HTTP server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ✓ Browser Streaming Server Running                    ║
║                                                           ║
║   HTTP Server:      http://localhost:${PORT}              ║
║   WebSocket Server: ws://localhost:${WS_PORT}             ║
║                                                           ║
║   Open: http://localhost:${PORT}                          ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down...');
  if (chromiumProcess) chromiumProcess.kill();
  if (gstreamerProcess) gstreamerProcess.kill();
  process.exit(0);
});