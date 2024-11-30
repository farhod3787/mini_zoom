const Peer = require('simple-peer');
const io = require('socket.io-client');
const socket = io('http://localhost:3000');

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const startCallButton = document.getElementById('startCall');

let peer;

navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then((stream) => {
  console.log('get User Media');
  localVideo.srcObject = stream;

  startCallButton.addEventListener('click', () => {
    console.log('Clicked');
    peer = new Peer({ initiator: true, trickle: false, stream });
    peer.on('signal', (data) => {
      socket.emit('start-call', data);
    });

    socket.on('call-accepted', (signal) => {
      peer.signal(signal);
    });

    peer.on('stream', (remoteStream) => {
      remoteVideo.srcObject = remoteStream;
    });
  });

  socket.on('start-call', (signal) => {
    console.log("Start Call");

    peer = new Peer({ initiator: false, trickle: false, stream });
    peer.signal(signal);

    peer.on('signal', (data) => {
      socket.emit('call-accepted', data);
    });

    peer.on('stream', (remoteStream) => {
      remoteVideo.srcObject = remoteStream;
    });
  });
});

