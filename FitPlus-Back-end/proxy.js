const http = require('http');
const { spawn } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');

const TARGET_HOST = 'localhost';
const TARGET_PORT = 52611;
const LISTEN_PORT = 5000;

const IIS_PATH = fs.existsSync('C:\\Program Files\\IIS Express\\iisexpress.exe')
  ? 'C:\\Program Files\\IIS Express\\iisexpress.exe'
  : 'C:\\Program Files (x86)\\IIS Express\\iisexpress.exe';

const IIS_CONFIG = path.join(__dirname, '.vs', 'FitPulseBackend.slnx', 'config', 'applicationhost.config');
const IIS_SITE = 'FitPulseBackend';

let iisProcess = null;

function checkBackendHealth(callback) {
  const req = http.request(
    { hostname: TARGET_HOST, port: TARGET_PORT, path: '/api/Meals/FoodItems', method: 'GET', timeout: 1500 },
    (res) => {
      callback(res.statusCode < 500);
    }
  );
  req.on('error', () => callback(false));
  req.on('timeout', () => {
    req.destroy();
    callback(false);
  });
  req.end();
}

function ensureIisExpressRunning() {
  checkBackendHealth((isHealthy) => {
    if (isHealthy) {
      console.log(`[FitPulse Proxy] Backend is already responding on port ${TARGET_PORT}.`);
      return;
    }

    if (!fs.existsSync(IIS_CONFIG)) {
      console.log(`[FitPulse Proxy] Start IIS Express from Visual Studio (click the green Play button or press F5).`);
      return;
    }

    console.log(`[FitPulse Proxy] Launching IIS Express for site "${IIS_SITE}"...`);
    try {
      iisProcess = spawn(IIS_PATH, [`/config:${IIS_CONFIG}`, `/site:${IIS_SITE}`], {
        stdio: 'ignore',
        detached: false,
      });

      iisProcess.on('error', (err) => {
        console.warn('[FitPulse Proxy] Could not auto-launch IIS Express:', err.message);
      });

      iisProcess.on('exit', (code) => {
        console.log(`[FitPulse Proxy] IIS Express exited with code ${code}`);
      });
    } catch (e) {
      console.warn('[FitPulse Proxy] Failed to start IIS Express:', e.message);
    }
  });
}

function printNetworkIps() {
  const interfaces = os.networkInterfaces();
  console.log(`\n================ FitPulse API Proxy ================`);
  console.log(`Listening on all network interfaces on port ${LISTEN_PORT}:`);
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(`  -> http://${iface.address}:${LISTEN_PORT}/api`);
      }
    }
  }
  console.log(`Forwarding requests to IIS Express at http://${TARGET_HOST}:${TARGET_PORT}`);
  console.log(`====================================================\n`);
}

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const headers = { ...req.headers, host: `${TARGET_HOST}:${TARGET_PORT}` };

  const proxyReq = http.request(
    {
      hostname: TARGET_HOST,
      port: TARGET_PORT,
      path: req.url,
      method: req.method,
      headers,
    },
    (proxyRes) => {
      const outHeaders = { ...proxyRes.headers };
      outHeaders['access-control-allow-origin'] = '*';
      res.writeHead(proxyRes.statusCode, outHeaders);
      proxyRes.pipe(res, { end: true });
    }
  );

  proxyReq.on('error', (err) => {
    console.error('[FitPulse Proxy] Error forwarding request:', err.message);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        message: 'Cannot connect to backend server. Make sure IIS Express is running on port 52611.',
      })
    );
  });

  req.pipe(proxyReq, { end: true });
});

server.listen(LISTEN_PORT, '0.0.0.0', () => {
  printNetworkIps();
  ensureIisExpressRunning();
});

function cleanup() {
  if (iisProcess && !iisProcess.killed) {
    iisProcess.kill();
  }
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
