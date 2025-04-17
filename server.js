const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express(); // ✅ define app before using it
const server = http.createServer(app);
const io = new Server(server);

// ✅ serve static frontend from public/
app.use(express.static(path.join(__dirname, 'public')));

// ✅ serve host.html at root /
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'host.html'));
});

// Socket.IO signaling logic
io.on('connection', (socket) => {
  console.log('🟢 Client connected:', socket.id);

  socket.on('join-room', ({ room, name }) => {
    socket.join(room);
    socket.to(room).emit('user-joined', { id: socket.id, name });
  });

  socket.on('signal', ({ targetId, signal }) => {
    io.to(targetId).emit('signal', { sourceId: socket.id, signal });
  });

  socket.on('disconnecting', () => {
    for (const room of socket.rooms) {
      socket.to(room).emit('user-left', socket.id);
    }
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
