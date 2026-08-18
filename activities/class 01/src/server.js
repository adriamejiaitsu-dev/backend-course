const http = require('http');

const server = http.createServer((request, response) => {
  const { method, url } = request;

  console.log(`${method} ${url}`);

  if (url === '/') {
    response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Bienvenido al servidor de la Clase 1');
    return;
  }

  if (url === '/health') {
    response.writeHead(200, { 'Content-Type': 'text/plain' });
    response.end('OK');
    return;
  }

  if (url === '/api/info') {
    const data = {
      server: 'Clase 01 - Desarrollo Backend',
      status: 'running',
      uptime: process.uptime(),
    };
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify(data));
    return;
  }

  response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  response.end('Ruta no encontrada');
});

server.listen(3000, () => {
  console.log('Servidor escuchando en http://localhost:3000');
});
