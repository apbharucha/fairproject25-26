const http = require('http');

const PORT = process.env.PORT ? Number(process.env.PORT) : 9000;

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify({ message: 'Backend up', url: req.url }));
});

server.listen(PORT, () => {
  console.log(`Backend listening at http://localhost:${PORT}`);
});

