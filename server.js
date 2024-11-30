// const express = require('express');
// const http = require('http');
// const { Server } = require('socket.io');

// const app = express();
// const server = http.createServer(app);
// const io = new Server(server);

// io.on('connection', (socket) => {
//   socket.on('start-call', (data) => {
//     socket.broadcast.emit('start-call', data);
//   });

//   socket.on('call-accepted', (data) => {
//     socket.broadcast.emit('call-accepted', data);
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

app.use(express.static('public')); // Serve static files from the 'public' directory

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join-room', (signalData) => {
    socket.broadcast.emit('user-connected', signalData);
  });

  socket.on('signal', (signalData) => {
    socket.broadcast.emit('signal', signalData);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
});

server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
