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


const socket = io('http://localhost:3000');
const videoGrid = document.getElementById('video-grid');
const peers = {};

// Generate a random room ID (you can modify this to use custom room IDs)
const roomId = 'default-room';
const myPeerId = Math.random().toString(36).substring(7);

// Get user's media stream
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then((myStream) => {
  addVideoStream(myStream, 'me');

  socket.emit('join-room', roomId, myPeerId);

  // Handle existing users in the room
  socket.on('existing-users', (users) => {
    users.forEach(userId => {
      const peer = createPeer(userId, myPeerId, myStream);
      peers[userId] = peer;
    });
  });

  // Handle new user connections
  socket.on('user-connected', (userId, socketId) => {
    console.log('New user connected:', userId);
    const peer = createPeer(socketId, myPeerId, myStream);
    peers[socketId] = peer;
  });

  // Handle incoming signals
  socket.on('signal', (userId, signal) => {
    if (peers[userId]) {
      peers[userId].signal(signal);
    }
  });

  // Handle user disconnection
  socket.on('user-disconnected', (userId) => {
    if (peers[userId]) {
      peers[userId].destroy();
      delete peers[userId];
      removeVideoStream(userId);
    }
  });
});

function createPeer(userToSignal, myId, stream) {
  const peer = new SimplePeer({
    initiator: true,
    trickle: false,
    stream: stream
  });

  peer.on('signal', signal => {
    socket.emit('signal', userToSignal, signal);
  });

  peer.on('stream', remoteStream => {
    addVideoStream(remoteStream, userToSignal);
  });

  return peer;
}

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