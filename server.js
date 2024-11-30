// const express = require('express');
// const http = require('http');
// const { Server } = require('socket.io');

// const app = express();
// const server = http.createServer(app);
// const io = new Server(server);

// app.use(express.static('public')); // Serve static files from the 'public' directory

// io.on('connection', (socket) => {
//   console.log('A user connected:', socket.id);

//   socket.on('join-room', (signalData) => {
//     socket.broadcast.emit('user-connected', signalData);
//   });

//   socket.on('signal', (signalData) => {
//     socket.broadcast.emit('signal', signalData);
//   });

//   socket.on('disconnect', () => {
//     console.log('A user disconnected:', socket.id);
//   });
// });

// server.listen(3000, () => {
//   console.log('Server is running on http://localhost:3000');
// });

const express = require('express');
const https = require('https');
const { Server } = require('socket.io');
const fs = require('fs');

const app = express();

const server = https.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.static('public'));

const rooms = new Map();

io.on('connection', (socket) => {
  console.log('New user connected:', socket.id);

  socket.on('join-room', (roomId, userId) => {
    console.log(`User ${userId} joining room ${roomId}`);
    socket.join(roomId);
    rooms.set(socket.id, { roomId, userId });

    // Notify others in the room
    socket.to(roomId).emit('user-connected', userId, socket.id);
  });

  socket.on('signal', (userId, signalData) => {
    console.log(`Signal from ${socket.id} to ${userId}`);
    socket.to(userId).emit('signal', socket.id, signalData);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    const userRoom = rooms.get(socket.id);
    if (userRoom) {
      socket.to(userRoom.roomId).emit('user-disconnected', socket.id);
      rooms.delete(socket.id);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});