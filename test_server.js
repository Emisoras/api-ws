const http = require('http');

const hostname = '0.0.0.0';
const port = process.env.PORT || 3000; // Usaremos 3000 por defecto, pero se puede cambiar con la variable de entorno

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World from simple Node.js server!\n');
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Trying another port...`);
    // Aquí podrías intentar otro puerto, pero para el diagnóstico, queremos ver si falla.
  } else {
    console.error('Server error:', e);
  }
});