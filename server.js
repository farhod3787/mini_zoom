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
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const rooms = new Map(); // Track users in rooms

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId);
    rooms.set(socket.id, { roomId, userId });

    // Get all other users in the room
    const usersInRoom = Array.from(io.sockets.adapter.rooms.get(roomId) || [])
      .filter(id => id !== socket.id);

    // Send list of existing users to the new participant
    socket.emit('existing-users', usersInRoom);

    // Notify others about new user
    socket.to(roomId).emit('user-connected', userId, socket.id);
  });

  socket.on('signal', (userId, signalData) => {
    const userRoom = rooms.get(socket.id);
    if (userRoom) {
      io.to(userRoom.roomId).emit('signal', userId, signalData);
    }
  });

  socket.on('disconnect', () => {
    const userRoom = rooms.get(socket.id);
    if (userRoom) {
      socket.to(userRoom.roomId).emit('user-disconnected', socket.id);
      rooms.delete(socket.id);
    }
    console.log('A user disconnected:', socket.id);
  });
});

server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});