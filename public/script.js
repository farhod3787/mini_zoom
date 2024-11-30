// const socket = io('http://localhost:3000');
// const videoGrid = document.getElementById('video-grid');

// navigator.mediaDevices.getUserMedia({
//   video: true,
//   audio: true
// }).then((stream) => {
//   addVideoStream(stream);

//   const peer = new SimplePeer({
//     initiator: true,
//     trickle: false,
//     stream: stream
//   });

//   peer.on('signal', (signalData) => {
//     socket.emit('join-room', signalData);
//   });

//   peer.on('stream', (remoteStream) => {
//     addVideoStream(remoteStream);
//   });

//   socket.on('user-connected', (userSignalData) => {
//     peer.signal(userSignalData);
//   });

//   socket.on('signal', (signalData) => {
//     peer.signal(signalData);
//   });
// });

// function addVideoStream(stream) {
//   const video = document.createElement('video');
//   video.srcObject = stream;
//   video.addEventListener('loadedmetadata', () => {
//     video.play();
//   });
//   videoGrid.appendChild(video);
// }


// Replace this line at the top of script.js
// Instead of const socket = io('http://localhost:3000');
const socket = io('/'); // This will automatically match your server's protocol and domain

const videoGrid = document.getElementById('video-grid');
const peers = {};

// Generate a random room ID and peer ID
const roomId = 'default-room';
const myPeerId = Math.random().toString(36).substring(7);

console.log('🆔 My peer ID:', myPeerId);

let myStream;

// Get user's media stream
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then((stream) => {
  console.log('📹 Got local stream');
  myStream = stream;
  addVideoStream(stream, 'me');

  socket.emit('join-room', roomId, myPeerId);
  console.log('🚪 Joined room:', roomId);

  // Handle incoming peer connections
  socket.on('user-connected', (userId, socketId) => {
    console.log('🆕 New user connected:', userId, socketId);
    connectToNewUser(socketId, stream);
  });
});

function connectToNewUser(userId, stream) {
  console.log('Connecting to new user:', userId);
  const peer = new SimplePeer({
    initiator: true,
    trickle: false,
    stream: stream
  });

  peer.on('signal', signal => {
    console.log('Sending signal to:', userId);
    socket.emit('signal', userId, signal);
  });

  peer.on('stream', remoteStream => {
    console.log('Received remote stream from:', userId);
    addVideoStream(remoteStream, userId);
  });

  peers[userId] = peer;
}

socket.on('signal', (userId, signal) => {
  console.log('Received signal from:', userId);
  if (!peers[userId]) {
    const peer = new SimplePeer({
      initiator: false,
      trickle: false,
      stream: myStream
    });

    peer.on('signal', signal => {
      socket.emit('signal', userId, signal);
    });

    peer.on('stream', remoteStream => {
      console.log('Adding remote stream from:', userId);
      addVideoStream(remoteStream, userId);
    });

    peers[userId] = peer;
  }

  peers[userId].signal(signal);
});

socket.on('user-disconnected', userId => {
  console.log('User disconnected:', userId);
  if (peers[userId]) {
    peers[userId].destroy();
    delete peers[userId];
    removeVideoStream(userId);
  }
});

function addVideoStream(stream, userId) {
  const video = document.createElement('video');
  video.srcObject = stream;
  video.id = `video-${userId}`;
  video.addEventListener('loadedmetadata', () => {
    video.play();
  });
  videoGrid.appendChild(video);
}

function removeVideoStream(userId) {
  const video = document.getElementById(`video-${userId}`);
  if (video) {
    video.remove();
  }
}

// Debug events
socket.on('connect', () => {
  console.log('Connected to server with ID:', socket.id);
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});