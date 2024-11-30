const socket = io('http://localhost:3000');
const videoGrid = document.getElementById('video-grid');

navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then((stream) => {
  addVideoStream(stream);

  const peer = new SimplePeer({
    initiator: true,
    trickle: false,
    stream: stream
  });

  peer.on('signal', (signalData) => {
    socket.emit('join-room', signalData);
  });

  peer.on('stream', (remoteStream) => {
    addVideoStream(remoteStream);
  });

  socket.on('user-connected', (userSignalData) => {
    peer.signal(userSignalData);
  });

  socket.on('signal', (signalData) => {
    peer.signal(signalData);
  });
});

function addVideoStream(stream) {
  const video = document.createElement('video');
  video.srcObject = stream;
  video.addEventListener('loadedmetadata', () => {
    video.play();
  });
  videoGrid.appendChild(video);
}
