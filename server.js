const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Be more specific in production
    methods: ["GET", "POST"]
  }
});

app.use(express.static('public'));

const rooms = new Map();

io.on('connection', (socket) => {
  console.log('👤 New connection:', socket.id);

  socket.on('join-room', (roomId, userId) => {
    console.log(`👥 User ${userId} joining room ${roomId}`);
    socket.join(roomId);
    rooms.set(socket.id, { roomId, userId });

    const usersInRoom = Array.from(io.sockets.adapter.rooms.get(roomId) || [])
      .filter(id => id !== socket.id);

    console.log(`📝 Existing users in room:`, usersInRoom);
    socket.emit('existing-users', usersInRoom);

    socket.to(roomId).emit('user-connected', userId, socket.id);
    console.log(`📢 Broadcasted new user ${userId} to room ${roomId}`);
  });

  socket.on('signal', (userId, signalData) => {
    console.log(`📡 Signal from ${socket.id} to ${userId}`);
    const userRoom = rooms.get(socket.id);
    if (userRoom) {
      socket.to(userRoom.roomId).emit('signal', socket.id, signalData);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client Disconnected: ', myPeerId);
    socket.broadcast.emit('user-disconnected', myPeerId)

    const userRoom = rooms.get(socket.id);
    if (userRoom) {
      console.log(`👋 User ${socket.id} disconnected from room ${userRoom.roomId}`);
      socket.to(userRoom.roomId).emit('user-disconnected', socket.id);
      rooms.delete(socket.id);
    }
  });
});

server.listen(3000, () => {
  console.log('🚀 Server running on http://localhost:3000');
});