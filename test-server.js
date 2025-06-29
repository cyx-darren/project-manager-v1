import http from 'http';

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <html>
      <body>
        <h1 style="color: green;">✅ Node.js HTTP Server Working!</h1>
        <p>This proves Node.js can create HTTP servers.</p>
        <p>Time: ${new Date().toLocaleTimeString()}</p>
      </body>
    </html>
  `);
});

const PORT = 3002;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Test server running at http://127.0.0.1:${PORT}/`);
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
});