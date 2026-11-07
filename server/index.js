import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

let lastState = null;

io.on('connection', (socket) => {
  console.log('client connected', socket.id);
  // Send last known state
  if (lastState) socket.emit('state', lastState);

  socket.on('state', (s) => {
    lastState = s;
    socket.broadcast.emit('state', s);
  });

  socket.on('control', (msg) => {
    // forward control messages to all other clients
    socket.broadcast.emit('control', msg);
  });

  socket.on('disconnect', () => {
    console.log('client disconnected', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Socket server listening on ${PORT}`));
