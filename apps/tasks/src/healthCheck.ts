import {createServer} from 'node:http';

export function startHealthServer(port = 3002): void {
  const server = createServer((req, res) => {
    if (req.url !== '/health') {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({status: 'ok', uptime: process.uptime()}));
  });
  server.on('error', (err) => {
    console.error('Health server error:', err);
  });
  server.listen(port, '127.0.0.1', () => {
    console.log(`Health check listening on http://127.0.0.1:${port}/health`);
  });
}
