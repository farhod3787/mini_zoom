const socket = io('/');
const videoGrid = document.getElementById('video-grid');
const peers = {};

// Generate a random room ID and peer ID
const roomId = 'default-room';
const myPeerId = Math.random().toString(36).substring(7);

console.log('🆔 My peer ID:', myPeerId);

// Get user's media stream
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then((myStream) => {
  console.log('📹 Got local stream');
  addVideoStream(myStream, 'me');

  socket.emit('join-room', roomId, myPeerId);
  console.log('🚪 Joined room:', roomId);

  // Handle existing users in the room
  socket.on('existing-users', (users) => {
    console.log('👥 Existing users in room:', users);
    users.forEach(userId => {
      console.log('Creating peer connection to existing user:', userId);
      const peer = createPeer(userId, myPeerId, myStream);
      peers[userId] = peer;
    });
  });

  // Handle new user connections
  socket.on('user-connected', (userId, socketId) => {
    console.log('🆕 New user connected:', userId, socketId);
    const peer = createPeer(socketId, myPeerId, myStream);
    peers[socketId] = peer;
  });

  socket.on('signal', (userId, signal) => {
    console.log('📡 Received signal from:', userId);
    if (peers[userId]) {
      peers[userId].signal(signal);
    } else {
      console.log('⚠️ No peer found for:', userId);
      // Create new peer if it doesn't exist
      const peer = new SimplePeer({
        initiator: false,
        trickle: false,
        stream: myStream
      });
      peers[userId] = peer;
      peer.on('signal', signal => {
        socket.emit('signal', userId, signal);
      });
      peer.on('stream', remoteStream => {
        console.log('📹 Received remote stream from:', userId);
        addVideoStream(remoteStream, userId);
      });
      peer.signal(signal);
    }
  });

  socket.on('user-disconnected', (userId) => {
    console.log('👋 User disconnected:', userId);
    if (peers[userId]) {
      peers[userId].destroy();
      delete peers[userId];
      removeVideoStream(userId);
    }
  });
});

function createPeer(userToSignal, myId, stream) {
  console.log('🔨 Creating new peer connection to:', userToSignal);
  const peer = new SimplePeer({
    initiator: true,
    trickle: false,
    stream: stream
  });

  peer.on('signal', signal => {
    console.log('📤 Sending signal to:', userToSignal);
    socket.emit('signal', userToSignal, signal);
  });

  peer.on('stream', remoteStream => {
    console.log('📹 Received remote stream');
    addVideoStream(remoteStream, userToSignal);
  });

  peer.on('error', err => {
    console.error('❌ Peer error:', err);
  });

  return peer;
}

function addVideoStream(stream, userId) {
  console.log('➕ Adding video stream for:', userId);
  const video = document.createElement('video');
  video.srcObject = stream;
  video.id = `video-${userId}`;
  video.addEventListener('loadedmetadata', () => {
    video.play();
  });
  videoGrid.appendChild(video);
}

function removeVideoStream(userId) {
  console.log('➖ Removing video stream for:', userId);
  const video = document.getElementById(`video-${userId}`);
  if (video) {
    video.remove();
  }
}

// Handle errors
socket.on('connect_error', (error) => {
  console.error('🔌 Socket connection error:', error);
});

window.onerror = function(msg, url, lineNo, columnNo, error) {
  console.error('🚫 Global error:', { msg, url, lineNo, columnNo, error });
  return false;
};