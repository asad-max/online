// signaling-server.js
// A simple Socket.IO signaling server for WebRTC

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();


const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});
app.use(express.static(path.join(__dirname)));
const rooms = {}; // { roomCode: [socketIds...] }

io.on('connection', socket => {
  console.log('🔌 Client connected:', socket.id);

  socket.on('join-room', ({ room, name }) => {
    socket.join(room);
    if (!rooms[room]) rooms[room] = [];
    rooms[room].push(socket.id);
    console.log(`📥 ${name} joined room ${room}`);

    // Notify others in the room
    socket.to(room).emit('user-joined', { id: socket.id, name });

    // Send existing users to new client
    socket.emit('all-users', rooms[room].filter(id => id !== socket.id));
  });

  socket.on('signal', ({ targetId, signal }) => {
    io.to(targetId).emit('signal', { sourceId: socket.id, signal });
  });

  socket.on('disconnecting', () => {
    for (const room of socket.rooms) {
      if (rooms[room]) {
        rooms[room] = rooms[room].filter(id => id !== socket.id);
        socket.to(room).emit('user-left', socket.id);
      }
    }
    console.log('❌ Client disconnected:', socket.id);
  });
});

server.listen(3000, () => {
  console.log('🚀 Signaling server running on http://localhost:3000');
});
