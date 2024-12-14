// /**
//  * Socket.io socket
//  */
// let socket;
// /**
//  * The stream object used to send media
//  */
// let localStream = null;
// /**
//  * All peer connections
//  */
// let peers = {}

// // redirect if not https
// if (location.href.substr(0, 5) !== 'https')
//     location.href = 'https' + location.href.substr(4, location.href.length - 4)


// //////////// CONFIGURATION //////////////////

// /**
//  * RTCPeerConnection configuration 
//  */
// const configuration = {
//     // Using From https://www.metered.ca/tools/openrelay/
//     "iceServers": [
//         {
//             urls: "stun:openrelay.metered.ca:80"
//         },
//         {
//             urls: "turn:openrelay.metered.ca:80",
//             username: "openrelayproject",
//             credential: "openrelayproject"
//         },
//         {
//             urls: "turn:openrelay.metered.ca:443",
//             username: "openrelayproject",
//             credential: "openrelayproject"
//         },
//         {
//             urls: "turn:openrelay.metered.ca:443?transport=tcp",
//             username: "openrelayproject",
//             credential: "openrelayproject"
//         }
//     ]
// }

// /**
//  * UserMedia constraints
//  */
// let constraints = {
//     audio: true,
//     video: {
//         width: {
//             max: 300
//         },
//         height: {
//             max: 300
//         }
//     }
// }

// /////////////////////////////////////////////////////////


// // enabling the camera at startup
// navigator.mediaDevices.getUserMedia(constraints).then(stream => {

//     console.log('Received local stream');

//     localVideo.srcObject = stream;
//     localStream = stream;

//     init()

// }).catch(e => alert(`getusermedia error ${e.name}`))

// /**
//  * initialize the socket connections
//  */
// function init() {
//     socket = io()

//     socket.on('initReceive', socket_id => {
//         console.log('INIT RECEIVE ' + socket_id)
//         addPeer(socket_id, false)

//         socket.emit('initSend', socket_id)
//     })

//     socket.on('initSend', socket_id => {
//         console.log('INIT SEND ' + socket_id)
//         addPeer(socket_id, true)
//     })

//     socket.on('removePeer', socket_id => {
//         console.log('removing peer ' + socket_id)
//         removePeer(socket_id)
//     })

//     socket.on('disconnect', () => {
//         console.log('GOT DISCONNECTED')
//         for (let socket_id in peers) {
//             removePeer(socket_id)
//         }
//     })

//     socket.on('signal', data => {
//         peers[data.socket_id].signal(data.signal)
//     })
// }

// /**
//  * Remove a peer with given socket_id. 
//  * Removes the video element and deletes the connection
//  * @param {String} socket_id 
//  */
// function removePeer(socket_id) {

//     let videoEl = document.getElementById(socket_id)
//     if (videoEl) {

//         const tracks = videoEl.srcObject.getTracks();

//         tracks.forEach(function (track) {
//             track.stop()
//         })

//         videoEl.srcObject = null
//         videoEl.parentNode.removeChild(videoEl)
//     }
//     if (peers[socket_id]) peers[socket_id].destroy()
//     delete peers[socket_id]
// }

// /**
//  * Creates a new peer connection and sets the event listeners
//  * @param {String} socket_id 
//  *                 ID of the peer
//  * @param {Boolean} am_initiator 
//  *                 Set to true if the peer initiates the connection process.
//  *                 Set to false if the peer receives the connection. 
//  */
// function addPeer(socket_id, am_initiator) {
//     peers[socket_id] = new SimplePeer({
//         initiator: am_initiator,
//         stream: localStream,
//         config: configuration
//     })

//     peers[socket_id].on('signal', data => {
//         socket.emit('signal', {
//             signal: data,
//             socket_id: socket_id
//         })
//     })

//     peers[socket_id].on('stream', stream => {
//         let newVid = document.createElement('video')
//         newVid.srcObject = stream
//         newVid.id = socket_id
//         newVid.playsinline = false
//         newVid.autoplay = true
//         newVid.className = "vid"
//         newVid.onclick = () => openPictureMode(newVid)
//         newVid.ontouchstart = (e) => openPictureMode(newVid)

//         // Create a container for the video and select box
//         let vidContainer = document.createElement('div');
//         vidContainer.className = "vid-container";
//         vidContainer.appendChild(newVid);

//         // Create the select box element
//         let selectBox = document.createElement('select');
//         selectBox.className = "select-box";
//         selectBox.innerHTML = '<option value="">Select Client</option>';

//         // Add an event listener to the select box
//         selectBox.addEventListener('change', (event) => {
//             let selectedSocketId = event.target.value;
//             if (selectedSocketId) {
//                 console.log('Sending "Hello world" to:', selectedSocketId);

//                 // Send the message using your Socket.io connection
//                 socket.emit('privateMessage', {
//                     to: selectedSocketId,
//                     message: 'Hello world'
//                 });
//             }
//         });

//         // Populate select box with client options 
//         for (let socket_id in peers) {
//             if (socket_id !== socket.id) {
//                 let option = document.createElement('option');
//                 option.value = socket_id;
//                 option.text = socket_id; // Or a user-friendly name
//                 selectBox.appendChild(option);
//             } else {
//                 console.log("you are: ", socket.id)
//             }

//         }

//         vidContainer.appendChild(selectBox);
//         videos.appendChild(vidContainer);
//     })
// }

// /**
//  * Opens an element in Picture-in-Picture mode
//  * @param {HTMLVideoElement} el video element to put in pip mode
//  */
// function openPictureMode(el) {
//     console.log('opening pip')
//     el.requestPictureInPicture()
// }

// /**
//  * Switches the camera between user and environment. It will just enable the camera 2 cameras not supported.
//  */
// function switchMedia() {
//     if (constraints.video.facingMode.ideal === 'user') {
//         constraints.video.facingMode.ideal = 'environment'
//     } else {
//         constraints.video.facingMode.ideal = 'user'
//     }

//     const tracks = localStream.getTracks();

//     tracks.forEach(function (track) {
//         track.stop()
//     })

//     navigator.mediaDevices.getUserMedia(constraints).then(stream => {

//         for (let socket_id in peers) {
//             for (let index in peers[socket_id].streams[0].getTracks()) {
//                 for (let index2 in stream.getTracks()) {
//                     if (peers[socket_id].streams[0].getTracks()[index].kind === stream.getTracks()[index2].kind) {
//                         peers[socket_id].replaceTrack(peers[socket_id].streams[0].getTracks()[index], stream.getTracks()[index2], peers[socket_id].streams[0])
//                         break;
//                     }
//                 }
//             }
//         }

//         localStream = stream

//         updateButtons()
//     })
// }

// /**
//  * Enable screen share
//  */
// function setScreen() {
//     navigator.mediaDevices.getDisplayMedia().then(stream => {
//         for (let socket_id in peers) {
//             for (let index in peers[socket_id].streams[0].getTracks()) {
//                 for (let index2 in stream.getTracks()) {
//                     if (peers[socket_id].streams[0].getTracks()[index].kind === stream.getTracks()[index2].kind) {
//                         peers[socket_id].replaceTrack(peers[socket_id].streams[0].getTracks()[index], stream.getTracks()[index2], peers[socket_id].streams[0])
//                         break;
//                     }
//                 }
//             }

//         }
//         localStream = stream

//         socket.emit('removeUpdatePeer', '')
//     })
//     updateButtons()
// }

// /**
//  * Disables and removes the local stream and all the connections to other peers.
//  */
// function removeLocalStream() {
//     if (localStream) {
//         const tracks = localStream.getTracks();

//         tracks.forEach(function (track) {
//             track.stop()
//         })
//     }

//     for (let socket_id in peers) {
//         removePeer(socket_id)
//     }
// }

// /**
//  * Enable/disable microphone
//  */
// function toggleMute() {
//     for (let index in localStream.getAudioTracks()) {
//         localStream.getAudioTracks()[index].enabled = !localStream.getAudioTracks()[index].enabled
//         muteButton.innerText = localStream.getAudioTracks()[index].enabled ? "Unmuted" : "Muted"
//         const muteButton = document.getElementById('muteButton');
//         if (localStream.getAudioTracks()[index].enabled) {
//             muteButton.classList.remove('red');
//         } else {
//             muteButton.classList.add('red');
//         }
//     }
// }

// /**
//  * Enable/disable video
//  */
// function toggleVid() {
//     for (let index in localStream.getVideoTracks()) {
//         localStream.getVideoTracks()[index].enabled = !localStream.getVideoTracks()[index].enabled
//         const vidButton = document.getElementById('vidButton');
//         if (localStream.getVideoTracks()[index].enabled) {
//             vidButton.classList.remove('red');
//         } else {
//             vidButton.classList.add('red');
//         }
//         vidButton.innerText = localStream.getVideoTracks()[index].enabled ? "Video Enabled" : "Video Disabled"
//     }
// }

// /**
//  * updating text of buttons
//  */
// function updateButtons() {
//     for (let index in localStream.getVideoTracks()) {
//         vidButton.innerText = localStream.getVideoTracks()[index].enabled ? "Video Enabled" : "Video Disabled"
//     }
//     for (let index in localStream.getAudioTracks()) {
//         muteButton.innerText = localStream.getAudioTracks()[index].enabled ? "Unmuted" : "Muted"
//     }
// }

/**
 * Socket.io socket
 */
let socket;
/**
 * The stream object used to send media
 */
let localStream = null;
/**
 * All peer connections
 */
let peers = {};

// Array to keep track of checked socket IDs
let checkedSocketIds = [];

// redirect if not https
if (location.href.substr(0, 5) !== 'https')
    location.href = 'https' + location.href.substr(4, location.href.length - 4)


//////////// CONFIGURATION //////////////////

/**
 * RTCPeerConnection configuration 
 */
const configuration = {
    // Using From https://www.metered.ca/tools/openrelay/
    "iceServers": [
        {
            urls: "stun:openrelay.metered.ca:80"
        },
        {
            urls: "turn:openrelay.metered.ca:80",
            username: "openrelayproject",
            credential: "openrelayproject"
        },
        {
            urls: "turn:openrelay.metered.ca:443",
            username: "openrelayproject",
            credential: "openrelayproject"
        },
        {
            urls: "turn:openrelay.metered.ca:443?transport=tcp",
            username: "openrelayproject",
            credential: "openrelayproject"
        }
    ]
}

/**
 * UserMedia constraints
 */
let constraints = {
    audio: true,
    video: {
        width: {
            max: 300
        },
        height: {
            max: 300
        }
    }
}

/////////////////////////////////////////////////////////


// enabling the camera at startup
navigator.mediaDevices.getUserMedia(constraints).then(stream => {

    console.log('Received local stream');

    localVideo.srcObject = stream;
    localStream = stream;

    init()

}).catch(e => alert(`getusermedia error ${e.name}`))


function sendMessage() {
    // Ensure socket is initialized
    if (!socket) {
        console.error('Socket not initialized');
        return;
    }

    const messageInput = document.getElementById('message-input');
    const message = messageInput.value.trim();

    if (!message) return;

    const selectedPeers = Array.from(document.querySelectorAll('.user-checkbox input:checked'))
        .map(checkbox => checkbox.value);

    if (selectedPeers.length === 0) {
        alert('Please select at least one peer to send the message to.');
        return;
    }
    const messageData = {
        message: message,
        sender: socket.id,
        recipients: selectedPeers
    };

    // Emit to server to broadcast to selected peers
    socket.emit('chat-message', messageData);

    // Display message locally for the sender
    displayMessage({
        message: message,
        sender: 'You',
        isLocal: true
    });

    messageInput.value = '';
}

// Make sure sendMessage is globally accessible
window.sendMessage = sendMessage;


function sendCaption() {
    // Ensure socket is initialized
    if (!socket) {
        console.error('Socket not initialized');
        return;
    }

    const messageInput = document.getElementById('message-input');
    const message = messageInput.value.trim();

    if (!message) return;

    const selectedPeers = Array.from(document.querySelectorAll('.user-checkbox input:checked'))
        .map(checkbox => checkbox.value);

    if (selectedPeers.length === 0) {
        alert('Please select at least one peer to send the message to.');
        return;
    }
    const messageData = {
        message: message,
        sender: socket.id,
        recipients: selectedPeers
    };

    // Emit to server to broadcast to selected peers
    socket.emit('chat-message', messageData);

    // Display message locally for the sender
    displayCaption({
        message: message,
        sender: 'You',
        isLocal: true
    });

    messageInput.value = '';
}

// Make sure sendMessage is globally accessible
window.sendCaption = sendCaption;



function speakMessage(message) {
    // Ensure we have a message to speak
    if (!message) {
        console.warn('No message provided for text-to-speech');
        return;
    }

    // Check for speech synthesis support
    if (!('speechSynthesis' in window)) {
        console.error('Text-to-speech is not supported in this browser');
        return;
    }

    try {
        // Create a new speech synthesis utterance
        const utterance = new SpeechSynthesisUtterance(message);

        // Configure speech parameters
        utterance.rate = 1.0;  // Speech speed (0.1 to 10)
        utterance.pitch = 1.0; // Speech pitch (0 to 2)

        // Optional: Choose a specific voice (uncomment and modify if needed)
        // const voices = window.speechSynthesis.getVoices();
        // utterance.voice = voices.find(voice => voice.lang === 'en-US');

        // Add event listeners for debugging
        utterance.addEventListener('start', () => {
            console.log('Speech started:', message);
        });

        utterance.addEventListener('error', (event) => {
            console.error('Speech synthesis error:', event);
        });

        utterance.addEventListener('end', () => {
            console.log('Speech ended');
        });

        // Speak the message
        window.speechSynthesis.speak(utterance);
    } catch (error) {
        console.error('Error in text-to-speech conversion:', error);
    }
}

function displayMessage(data) {
    const chatMessages = document.getElementById('chat-messages');
    const messageEl = document.createElement('div');

    messageEl.innerHTML = `<strong>${data.sender}:</strong> ${data.message}`;
    messageEl.style.color = data.isLocal ? 'black' : 'black';

    chatMessages.appendChild(messageEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Only speak non-local messages
    if (!data.isLocal) {
        // Slight delay to ensure DOM is updated
        setTimeout(() => {
            speakMessage(data.message);
        }, 100);
    }
}


function displayCaption(data) {
    const chatMessages = document.getElementById('caption-messages');
    const messageEl = document.createElement('div');

    messageEl.innerHTML = `<strong>${data.sender}:</strong> ${data.message}`;
    messageEl.style.color = 'white';

    chatMessages.appendChild(messageEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Only speak non-local messages
    // if (!data.isLocal) {
    //     // Slight delay to ensure DOM is updated
    //     setTimeout(() => {
    //         speakMessage(data.message);
    //     }, 100);
    // }
}


function logAvailableVoices() {
    if ('speechSynthesis' in window) {
        const voices = window.speechSynthesis.getVoices();
        console.log('Available voices:', voices.map(voice => ({
            name: voice.name,
            lang: voice.lang
        })));
    }
}

window.addEventListener('load', logAvailableVoices);


function updatePeerList() {
    const userList = document.getElementById('user-list');
    userList.innerHTML = ''; // Clear existing list

    for (let socket_id in peers) {
        const userCheckbox = document.createElement('div');
        userCheckbox.className = 'user-checkbox';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `user - ${socket_id}`;
        checkbox.value = socket_id;

        const label = document.createElement('label');
        label.htmlFor = `user - ${socket_id}`;
        label.textContent = ` Peer ${socket_id.substring(0, 5)}`;

        userCheckbox.appendChild(checkbox);
        userCheckbox.appendChild(label);
        userList.appendChild(userCheckbox);
    }
}


/**
 * initialize the socket connections
 */
function init() {
    socket = io()

    socket.on('initReceive', socket_id => {
        console.log('INIT RECEIVE ' + socket_id)
        addPeer(socket_id, false)

        socket.emit('initSend', socket_id)
    })

    socket.on('initSend', socket_id => {
        console.log('INIT SEND ' + socket_id)
        addPeer(socket_id, true)
    })

    socket.on('removePeer', socket_id => {
        console.log('removing peer ' + socket_id)
        removePeer(socket_id)
    })

    socket.on('disconnect', () => {
        console.log('GOT DISCONNECTED')
        for (let socket_id in peers) {
            removePeer(socket_id)
        }
    })

    socket.on('transcription', data => {
        displayTranscription({
            text: data.text,
            sender: `Peer ${data.sender.substring(0, 5)}`,
            isLocal: false
        });
    });

    socket.on('signal', data => {
        peers[data.socket_id].signal(data.signal)
    })

    socket.on('chat-message', data => {
        if (data.type === 'caption') {
            displayCaption({
                text: data.message,
                sender: `Peer ${data.sender.substring(0, 5)}`,
                isLocal: false
            });
        } else {
            // Handle regular chat messages as before
            displayMessage({
                message: data.message,
                sender: `Peer ${data.sender.substring(0, 5)}`,
                isLocal: false
            });
        }
    });

}


function displayTranscription(data) {
    if (data.sender !== socket.id) {
        const transcriptionDiv = document.querySelector('.transcription-text');

        // Append new text to existing content
        const currentText = transcriptionDiv.textContent || '';
        const newWords = data.text.split(' ');
        const allWords = [...currentText.split(' '), ...newWords];

        // Keep only last 10 words
        const recentWords = allWords.slice(-10);
        transcriptionDiv.textContent = recentWords.join(' ');

        // Set timer to remove old words
        setTimeout(() => {
            const words = transcriptionDiv.textContent.split(' ');
            if (words.length > 5) {
                // Remove first 5 words
                transcriptionDiv.textContent = words.slice(5).join(' ');
            }
        }, 5000);
    }
}

/**
 * Remove a peer with given socket_id. 
 * Removes the video element and deletes the connection
 * @param {String} socket_id 
 */
function removePeer(socket_id) {

    let videoEl = document.getElementById(socket_id)
    if (videoEl) {

        const tracks = videoEl.srcObject.getTracks();

        tracks.forEach(function (track) {
            track.stop()
        })

        videoEl.srcObject = null
        videoEl.parentNode.removeChild(videoEl)
    }
    if (peers[socket_id]) peers[socket_id].destroy()
    delete peers[socket_id]
    updatePeerList()
}

/**
 * Creates a new peer connection and sets the event listeners
 * @param {String} socket_id 
 *                ID of the peer
 * @param {Boolean} am_initiator 
 *                Set to true if the peer initiates the connection process.
 *                Set to false if the peer receives the connection. 
 */
function addPeer(socket_id, am_initiator) {
    peers[socket_id] = new SimplePeer({
        initiator: am_initiator,
        stream: localStream,
        config: configuration
    })

    peers[socket_id].on('signal', data => {
        socket.emit('signal', {
            signal: data,
            socket_id: socket_id
        })
    })

    // peers[socket_id].on('stream', stream => {
    //     let newVid = document.createElement('video');
    //     newVid.srcObject = stream;
    //     newVid.id = socket_id;
    //     newVid.playsinline = false;
    //     newVid.autoplay = true;
    //     newVid.className = "vid";
    //     newVid.onclick = () => openPictureMode(newVid);
    //     newVid.ontouchstart = (e) => openPictureMode(newVid);

    //     // Create a container for the video and text
    //     let vidContainer = document.createElement('div');
    //     vidContainer.className = "vid-container";
    //     vidContainer.appendChild(newVid);

    //     // Create the socket ID text element
    //     let socketIdText = document.createElement('div');
    //     socketIdText.className = "socket-id-text";
    //     socketIdText.textContent = `${socket_id}`;

    //     // Append the socket ID text to the container
    //     vidContainer.appendChild(socketIdText);

    //     // Add the container to the videos element
    //     videos.appendChild(vidContainer);

    //     updatePeerList();
    // });

    // peers[socket_id].on('stream', stream => {
    //     let newVid = document.createElement('video');
    //     newVid.srcObject = stream;
    //     newVid.id = socket_id;
    //     newVid.playsinline = false;
    //     newVid.autoplay = true;
    //     newVid.className = "vid";
    //     newVid.onclick = () => openPictureMode(newVid);
    //     newVid.ontouchstart = (e) => openPictureMode(newVid);

    //     // Create a container for the video and text
    //     let vidContainer = document.createElement('div');
    //     vidContainer.className = "vid-container";
    //     vidContainer.appendChild(newVid);

    //     // Create the socket ID text element
    //     let socketIdText = document.createElement('div');
    //     socketIdText.className = "socket-id-text";
    //     socketIdText.textContent = `${socket_id}`;

    //     // Append the socket ID text to the container
    //     vidContainer.appendChild(socketIdText);

    //     // Add the container to the videos element
    //     videos.appendChild(vidContainer);

    //     updatePeerList();
    //   });

    peers[socket_id].on('stream', stream => {
        let newVid = document.createElement('video');
        newVid.srcObject = stream;
        newVid.id = socket_id;
        newVid.playsinline = false;
        newVid.autoplay = true;
        newVid.className = "vid";
        newVid.onclick = () => openPictureMode(newVid);
        newVid.ontouchstart = (e) => openPictureMode(newVid);

        // Create a container for the video and text
        let vidContainer = document.createElement('div');
        vidContainer.className = "vid-container";
        vidContainer.appendChild(newVid);

        // Create the socket ID text element
        let socketIdText = document.createElement('div');
        socketIdText.className = "socket-id-text";
        socketIdText.textContent = `${socket_id}`;

        // Append the socket ID text to the container
        vidContainer.appendChild(socketIdText);

        // Add the container to the videos element
        videos.appendChild(vidContainer);

        // Dynamically adjust video sizes
        adjustVideoSizes();

        updatePeerList();
    });



    function adjustVideoSizes() {
        const videoContainers = document.querySelectorAll('.vid-container');
        const totalVideos = videoContainers.length;

        // CSS grid layout
        const videosElement = document.getElementById('videos');
        videosElement.style.display = 'grid';

        if (totalVideos === 1) {
            // Single video takes up most of the screen
            videosElement.style.gridTemplateColumns = '1fr';
            videoContainers.forEach(container => {
                container.style.width = '50%';
                container.style.height = '50vh';
                container.style.justifySelf = 'center';
            container.style.alignSelf = 'center';
            container.style.placeSelf = 'center';
            });
        } else if (totalVideos === 2) {
            // Two videos side by side
            videosElement.style.gridTemplateColumns = '1fr 1fr';
            videoContainers.forEach(container => {
                container.style.width = '100%';
                container.style.height = '50vh';
            });
        } else if (totalVideos <= 4) {
            // Up to 4 videos in a 2x2 grid
            videosElement.style.gridTemplateColumns = '1fr 1fr';
            videoContainers.forEach(container => {
                container.style.width = '100%';
                container.style.height = '50vh';
            });
        } else {
            // More than 4 videos in a responsive grid
            const columns = Math.ceil(Math.sqrt(totalVideos));
            videosElement.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
            videoContainers.forEach(container => {
                container.style.width = '100%';
                container.style.height = '33vh';
            });
        }
    }

    // Add this CSS to your stylesheet for best results
    const style = document.createElement('style');
    style.textContent = `
        #videos {
            display: grid;
            gap: 10px;
            width: 100%;
            height: 100%;
        }
        .vid-container {
            position: relative;
            overflow: hidden;
        }
        .vid-container video {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        .socket-id-text {
            position: absolute;
            bottom: 10px;
            left: 10px;
            background: rgba(0,0,0,0.5);
            color: white;
            padding: 5px;
            border-radius: 3px;
        }
    `;
    document.head.appendChild(style);

}

/**
 * Opens an element in Picture-in-Picture mode
 * @param {HTMLVideoElement} el video element to put in pip mode
 */
function openPictureMode(el) {
    console.log('opening pip')
    el.requestPictureInPicture()
}

/**
 * Switches the camera between user and environment. It will just enable the camera 2 cameras not supported.
 */
function switchMedia() {
    if (constraints.video.facingMode.ideal === 'user') {
        constraints.video.facingMode.ideal = 'environment'
    } else {
        constraints.video.facingMode.ideal = 'user'
    }

    const tracks = localStream.getTracks();

    tracks.forEach(function (track) {
        track.stop()
    })

    navigator.mediaDevices.getUserMedia(constraints).then(stream => {

        for (let socket_id in peers) {
            for (let index in peers[socket_id].streams[0].getTracks()) {
                for (let index2 in stream.getTracks()) {
                    if (peers[socket_id].streams[0].getTracks()[index].kind === stream.getTracks()[index2].kind) {
                        peers[socket_id].replaceTrack(peers[socket_id].streams[0].getTracks()[index], stream.getTracks()[index2], peers[socket_id].streams[0])
                        break;
                    }
                }
            }
        }

        localStream = stream

        updateButtons()
    })
}

/**
 * Enable screen share
 */
function setScreen() {
    navigator.mediaDevices.getDisplayMedia().then(stream => {
        for (let socket_id in peers) {
            for (let index in peers[socket_id].streams[0].getTracks()) {
                for (let index2 in stream.getTracks()) {
                    if (peers[socket_id].streams[0].getTracks()[index].kind === stream.getTracks()[index2].kind) {
                        peers[socket_id].replaceTrack(peers[socket_id].streams[0].getTracks()[index], stream.getTracks()[index2], peers[socket_id].streams[0])
                        break;
                    }
                }
            }

        }
        localStream = stream

        socket.emit('removeUpdatePeer', '')
    })
    updateButtons()
}

/**
 * Disables and removes the local stream and all the connections to other peers.
 */
function removeLocalStream() {
    if (localStream) {
        const tracks = localStream.getTracks();

        tracks.forEach(function (track) {
            track.stop()
        })
    }

    for (let socket_id in peers) {
        removePeer(socket_id)
    }
}

/**
 * Enable/disable microphone
 */

let isMuted = false;

function toggleMute() {
    isMuted = !isMuted;
    const micIcon = document.getElementById("micIcon");
    micIcon.src = isMuted ? "assets/mic.svg" : "assets/mic_mute.svg";
    for (let index in localStream.getAudioTracks()) {
        localStream.getAudioTracks()[index].enabled = !localStream.getAudioTracks()[index].enabled
        muteButton.innerText = localStream.getAudioTracks()[index].enabled ? "Unmuted" : "Muted"
        const muteButton = document.getElementById('muteButton');
        if (localStream.getAudioTracks()[index].enabled) {
            muteButton.classList.remove('red');
        } else {
            muteButton.classList.add('red');
        }
    }
}

/**
 * Enable/disable video
 */

let isVideoOn = true;

function toggleVid() {
    isVideoOn = !isVideoOn;
    const videoIcon = document.getElementById("videoIcon");
    videoIcon.src = isVideoOn ? "assets/video_mute.svg" : "assets/video.svg";

    for (let index in localStream.getVideoTracks()) {
        localStream.getVideoTracks()[index].enabled = !localStream.getVideoTracks()[index].enabled
        const vidButton = document.getElementById('vidButton');
        if (localStream.getVideoTracks()[index].enabled) {
            vidButton.classList.remove('red');
        } else {
            vidButton.classList.add('red');
        }
    }
}

/**
 * updating text of buttons
 */
function updateButtons() {
    for (let index in localStream.getVideoTracks()) {
        vidButton.innerText = localStream.getVideoTracks()[index].enabled ? "Video Enabled" : "Video Disabled"
    }
    for (let index in localStream.getAudioTracks()) {
        muteButton.innerText = localStream.getAudioTracks()[index].enabled ? "Unmuted" : "Muted"
    }
}