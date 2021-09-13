const socket = io("/");
const chatInputBox = document.getElementById("chat_message");
const all_messages = document.getElementById("all_messages");
const leave_meeting = document.getElementById("leave-meeting");
const main__chat__window = document.getElementById("main__chat__window");
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
myVideo.muted = true;
var screenSharing = false;

var peer = new Peer(undefined, {
  path: "/peerjs",
  host: "/",
  port: "3030",
});

var displayMediaOptions = {
  video: {
    cursor: "always",
  },
  audio: false,
};

let myVideoStream;
//let screenStream;

var getUserMedia =
  navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia;

navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream);

    peer.on("call", (call) => {
      call.answer(stream);
      const video = document.createElement("video");

      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });

    socket.on("user-connected", (userId) => {
      connectToNewUser(userId, stream);
    });

   /* socket.on("user-disconnected", (userId) => {
      if (peers[userId]) peers[userId].close();
      speakText(`user ${userId} leaved`);
    });*/

    document.addEventListener("keydown", (e) => {
      if (e.which === 13 && chatInputBox.value != "") {
        socket.emit("message", chatInputBox.value);
        chatInputBox.value = "";
      }
    });

    socket.on("createMessage", (msg) => {
      console.log(msg);
      let li = document.createElement("li");
      li.innerHTML = msg;
      all_messages.append(li);
      main__chat__window.scrollTop = main__chat__window.scrollHeight;
    });
  });

peer.on("call", function (call) {
  getUserMedia(
    { video: true, audio: true },
    function (stream) {
      call.answer(stream); // Answer the call with an A/V stream.
      const video = document.createElement("video");
      call.on("stream", function (remoteStream) {
        addVideoStream(video, remoteStream);
      });
    },
    function (err) {
      console.log("Failed to get local stream", err);
    }
  );
});

peer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id);
});

socket.on("disconnect", function () {
  socket.emit("leave-room", ROOM_ID, id);
});

// CHAT

const connectToNewUser = (userId, streams) => {
  var call = peer.call(userId, streams);
  console.log(call);
  var video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    console.log(userVideoStream);
    addVideoStream(video, userVideoStream);
  });
};

const addVideoStream = (videoEl, stream) => {
  videoEl.srcObject = stream;
  videoEl.addEventListener("loadedmetadata", () => {
    videoEl.play();
  });

  videoGrid.append(videoEl);
  let totalUsers = document.getElementsByTagName("video").length;
  if (totalUsers > 1) {
    for (let index = 0; index < totalUsers; index++) {
      document.getElementsByTagName("video")[index].style.width =
        100 / totalUsers + "%";
    }
  }
};

const playStop = () => {
  let enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideo();
  } else {
    setStopVideo();
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
};

const muteUnmute = () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setUnmuteButton();
  } else {
    setMuteButton();
    myVideoStream.getAudioTracks()[0].enabled = true;
  }
};

const setPlayVideo = () => {
  const html = `<i class="unmute fa fa-pause-circle"></i>
  <span class="unmute">Resume Video</span>`;
  document.getElementById("playPauseVideo").innerHTML = html;
};

const setStopVideo = () => {
  const html = `<i class=" fa fa-video-camera"></i>
  <span class="">Pause Video</span>`;
  document.getElementById("playPauseVideo").innerHTML = html;
};

const setUnmuteButton = () => {
  const html = `<i class="unmute fa fa-microphone-slash"></i>
  <span class="unmute">Unmute</span>`;
  document.getElementById("muteButton").innerHTML = html;
};
const setMuteButton = () => {
  const html = `<i class="fa fa-microphone"></i>
  <span>Mute</span>`;
  document.getElementById("muteButton").innerHTML = html;
};

const ShowChat = (e) => {
	e.classList.toggle("active");
	document.body.classList.toggle("showChat");
};

const showInvitePopup = () => {
  document.body.classList.add("showInvite");
  document.getElementById("roomLink").value = window.location.href;
};

const hiddeInvitePopup = () => {
  document.body.classList.remove("showInvite");
};

const copyToClipboard = () => {
  /*Get the text field */
  var copyText = document.getElementById("roomLink");

  /*Select the text field */
  copyText.select();
  copyText.setSelectionRange(0, 99999); /*for mobile devices */
  
  /*copy the text inside the text field */
  document.execCommand("copy");

  /*Alert the copied text*/
  alert("Copied: " + copyText.value);

  hideInvitePopup();
};


/*function startScreenShare() {
  if (screenSharing) {
      stopScreenSharing()
  }
  navigator.mediaDevices.getDisplayMedia({ video: true }).then((stream) => {
      screenStream = stream;
      let capture = stream.getVideoTracks()[0];
      capture.onended = () => {
          stopScreenSharing()
      }
      if (peer) {
          var sender = currentPeer.peerConnection.getSenders().find(function (video) {
              return video.track.kind == myVideo.kind;
          })
          sender.replaceTrack(video)
          screenSharing = true
      }
      console.log(screenStream)
  })
};

function stopScreenShare() {
  if (!screenSharing) return;
  let capture = local_stream.getVideoTracks()[0];
  if (peer) {
      let sender = currentPeer.peerConnection.getSenders().find(function (s) {
          return s.track.kind == videoTrack.kind;
      })
      sender.replaceTrack(capture)
  }
  screenStream.getTracks().forEach(function (track) {
      track.stop();
  });
  screenSharing = false
};*/

async function startScreenShare() {
  let capture = null;
  try {
    capture = await navigator.mediaDevices.getDisplayMedia(
      displayMediaOptions
    );

    capture
      .getVideoTracks()[0]
      .addEventListener("ended", () => stopScreenShare());

    myVideo.srcObject = capture;//reemplaza la camara por lo que esta capturando 
  } catch (error) {
    console.log(error);
  }
}

function stopScreenShare() {
  let tracks = myVideo.srcObject.getTracks();
  tracks.forEach((track) => track.stop());
  myVideo.srcObject = myVideoStream;// regresa a la camara
}

