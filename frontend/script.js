// Sample onlineList data (you might be fetching this dynamically in a real application)

server_ip = "192.168.8.67"
const onlineList = [
    { name: "Intercom 1", ip: "192.168.8.67" },
    { name: "Intercom 2", ip: "192.168.1.2" },
    { name: "Intercom 3", ip: "127.0.0.1" }, // Note: 127.0.0.1 refers to the local machine
    { name: "Intercom 4", ip: "192.168.1.4" },
    { name: "Intercom 5", ip: "192.168.1.5" },
    // Add more devices as needed
];

const userListElement = document.getElementById("userList");
const actionButtons = document.getElementById("actionButtons");
const callButton = document.getElementById("callButton");
const cancelButton = document.getElementById("cancelButton");
const callModal = document.getElementById("callModal");
const closeModal = document.getElementById("closeModal");
const callStatusElement = document.getElementById("callStatus");
const pickupButton = document.getElementById('pickupButton');
const rejectButton = document.getElementById('rejectButton');

// Establish Socket.io connection
const socket = io('http://localhost:3000'); // Ensure this matches your backend URL

// Upon connection, register the device with its IP
socket.on('connect', () => {
    console.log('Connected to server with socket ID:', socket.id);
    // Assuming each device knows its own IP; replace 'YOUR_DEVICE_IP' with actual IP
    const deviceIp = getDeviceIp(); // Implement this function based on your environment
    socket.emit('register', { ip: deviceIp });
});

// Listen for incoming call events
socket.on('incomingCall', (data) => {
    const { callId, ip } = data;
    console.log(`Incoming call from IP: ${ip} with Call ID: ${callId}`);
    showCallModal(ip, callId);
});

// Function to get the device's IP address
function getDeviceIp() {
    // Implement a method to retrieve the device's actual IP address.
    // This might require server-side assistance or environment-specific code.
    // For demonstration, returning a placeholder:
    return "192.168.8.67"; // Replace with actual IP retrieval logic
}

// Function to display the call modal
function showCallModal(callerIp, callId) {
    callStatusElement.textContent = `Incoming Call from ${callerIp}`;
    callModal.style.display = "flex"; // Make sure modal is visible
    callModal.setAttribute('data-call-id', callId); // Store Call ID in modal
}

// Function to hide the call modal
function hideCallModal() {
    callModal.style.display = "none";
    callStatusElement.textContent = 'Incoming Call...';
    callModal.removeAttribute('data-call-id');
}

// Event listener for close (X) button
closeModal.addEventListener('click', hideCallModal);

// Event listener for Pickup button
pickupButton.addEventListener('click', () => {
    const callId = callModal.getAttribute('data-call-id');
    const ip = callModal.getAttribute('data-call-ip') || extractIpFromStatus();
    console.log('Call accepted.');
    // Emit 'callResponse' to the server with Call ID
    socket.emit('callResponse', { callId, response: 'accepted' });
    // Implement additional pickup call logic here
    hideCallModal();
    launchVideoChat(); // Call the launchVideoChat function
});

// Event listener for Reject button
rejectButton.addEventListener('click', () => {
    const callId = callModal.getAttribute('data-call-id');
    const ip = callModal.getAttribute('data-call-ip') || extractIpFromStatus();
    console.log('Call rejected.');
    // Emit 'callResponse' to the server with Call ID
    socket.emit('callResponse', { callId, response: 'rejected' });
    // Implement additional reject call logic here
    hideCallModal();
});

// Function to extract IP from the call status element (if needed)
function extractIpFromStatus() {
    const text = callStatusElement.textContent;
    const ipMatch = text.match(/from\s([0-9.]+)/);
    return ipMatch ? ipMatch[1] : 'Unknown IP';
}

// Array to keep track of selected devices
const selectedDevices = [];

// Flag to indicate if selection mode is active
let selectionMode = false;

// Function to render online devices
function renderOnlineDevices() {
    userListElement.innerHTML = ''; // Clear existing list
    onlineList.forEach((device, index) => {
        // Create user item container
        const userItem = document.createElement("div");
        userItem.className = "user-item";
        userItem.setAttribute("data-index", index);

        // Create user info container
        const userInfo = document.createElement("div");
        userInfo.className = "user-info";

        // Create name element
        const nameElement = document.createElement("span");
        nameElement.className = "name";
        nameElement.textContent = device.name;

        // Create IP element
        const ipElement = document.createElement("span");
        ipElement.className = "ip";
        ipElement.textContent = device.ip;

        // Append name and IP to user info
        userInfo.appendChild(nameElement);
        userInfo.appendChild(ipElement);

        // Append user info to user item
        userItem.appendChild(userInfo);

        // Append user item to user list
        userListElement.appendChild(userItem);

        // Add selection listeners
        addSelectionListeners(userItem, device);
    });
}

function launchVideoChat() {
    // Open the video chat in a new window with maximum dimensions
    const width = screen.width;
    const height = screen.height;
    const videoChatWindow = window.open(
        "http://" + server_ip + ":3012/video-chat.html",
        "VideoChat",
        `width=${width},height=${height},left=0,top=0,resizable=yes,scrollbars=yes`
    );

    if (videoChatWindow) {
        videoChatWindow.focus();

        // Wait for the window to load
        videoChatWindow.onload = function () {
            // Add fullscreen request script to the new window
            const script = videoChatWindow.document.createElement("script");
            script.textContent = `
            // Function to request fullscreen
            function enterFullscreen() {
                const element = document.documentElement;
                if (element.requestFullscreen) {
                    element.requestFullscreen();
                } else if (element.webkitRequestFullscreen) { // Safari
                    element.webkitRequestFullscreen();
                } else if (element.msRequestFullscreen) { // IE11
                    element.msRequestFullscreen();
                }
            }

            // Add click listener to enter fullscreen on first interaction
            document.addEventListener('click', function fullscreenHandler() {
                enterFullscreen();
                // Remove the listener after first click
                document.removeEventListener('click', fullscreenHandler);
            }, { once: true });

            // Add visible instructions
            const instructions = document.createElement('div');
            instructions.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.7); color: white; padding: 10px 20px; border-radius: 5px; z-index: 9999;';
            instructions.textContent = 'Click anywhere to enter fullscreen mode';
            document.body.appendChild(instructions);

            // Remove instructions after entering fullscreen
            document.addEventListener('fullscreenchange', function() {
                if (document.fullscreenElement) {
                    instructions.remove();
                }
            });
        `;
            videoChatWindow.document.body.appendChild(script);
        };
    }
}

// Function to add selection listeners to an element
function addSelectionListeners(element, device) {
    let timeoutId;
    let wasLongPress = false; // Flag to track long press

    // Function to toggle selection
    const toggleSelect = () => {
        if (element.classList.contains("selected")) {
            element.classList.remove("selected");
            const idx = selectedDevices.findIndex(d => d.ip === device.ip);
            if (idx > -1) selectedDevices.splice(idx, 1);
        } else {
            element.classList.add("selected");
            selectedDevices.push(device);
        }
        updateActionButtons();
    };

    // Long press for initial selection
    const startPress = (e) => {
        e.preventDefault();
        wasLongPress = false;
        timeoutId = setTimeout(() => {
            wasLongPress = true;
            toggleSelect();
        }, 500); // 500ms for long press
    };

    const cancelPress = () => {
        clearTimeout(timeoutId);
    };

    // Touch events
    element.addEventListener("touchstart", startPress);
    element.addEventListener("touchend", cancelPress);
    element.addEventListener("touchcancel", cancelPress);

    // Mouse events
    element.addEventListener("mousedown", startPress);
    element.addEventListener("mouseup", cancelPress);
    element.addEventListener("mouseleave", cancelPress);

    // Click event for selection mode
    element.addEventListener("click", (e) => {
        if (selectionMode && !wasLongPress) {
            toggleSelect();
        }
    });
}

// Function to update the visibility of action buttons
function updateActionButtons() {
    if (selectedDevices.length > 0) {
        actionButtons.style.display = "flex";
        selectionMode = true; // Ensure selection mode is active
    } else {
        actionButtons.style.display = "none";
        selectionMode = false;
    }
}

// Function to handle Call button click
function handleCall() {
    if (selectedDevices.length > 0) {
        if (selectedDevices.length > 1) {
            // Multiple devices selected
            const ips = selectedDevices.map(device => device.ip);
            callMultiple(ips);
        } else {
            // Single device selected
            const ip = selectedDevices[0].ip;
            callSingle(ip);
        }
        // After calling, clear selections
        clearSelections();
    }
}

// Function to call a single device
function callSingle(ip) {
    fetch('http://' + ip + ':3000/api/call', { // Ensure the backend URL is correct
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ip: ip })
    })
        .then(response => {
            if (response.status === 200) {
                launchVideoChat(); // Call the launchVideoChat function
                return response.json();
            } else {
                return response.json().then(errData => {
                    throw new Error(errData.error || 'Call initiation failed');
                });
            }
        })
        .then(data => {
            console.log('Call response:', data.message);
            // Additional handling if needed
        })
        .catch(error => {
            console.error('Error initiating call:', error.message);
            // Handle errors (e.g., display a notification to the user)
        });
}

// Function to call multiple devices
function callMultiple(ips) {
    fetch('http://localhost:3000/api/call', { // Ensure the backend URL is correct
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ip: ips })
    })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                console.log('Calls initiated:', data.message);
                // Optionally, display a notification to the initiator
            }
            if (data.error) {
                console.error('Error initiating calls:', data.error);
                // Optionally, display an error notification
            }
        })
        .catch(error => {
            console.error('Error initiating calls:', error);
            // Optionally, display an error notification
        });
}

// Function to handle Cancel button click
function handleCancel() {
    clearSelections();
}

// Function to clear all selections
function clearSelections() {
    selectedDevices.length = 0; // Clear the array
    const userItems = document.querySelectorAll(".user-item.selected");
    userItems.forEach(item => {
        item.classList.remove("selected");
    });
    updateActionButtons();
    selectionMode = false;
}

// Add event listeners to action buttons
callButton.addEventListener("click", handleCall);
cancelButton.addEventListener("click", handleCancel);

// Add event listener to close modal
closeModal.addEventListener("click", hideCallModal);

// Function to handle clicks outside the user list, action buttons, and modal
function handleClickOutside(event) {
    const isClickInside = userListElement.contains(event.target) || actionButtons.contains(event.target) || callModal.contains(event.target);
    if (!isClickInside && selectedDevices.length > 0) {
        clearSelections();
    }
}

// Listen for clicks on the entire document
document.addEventListener("click", handleClickOutside);

// Function to close modal when clicking outside the modal content
window.addEventListener("click", function (event) {
    if (event.target === callModal) {
        hideCallModal();
    }
});

// Sample logs data
const logs = [
    {
        name: "User Name 1",
        ip: "192.168.1.1",
        time: "12:00 PM",
        status: "picked",
    },
    {
        name: "User Name 2",
        ip: "192.168.1.2",
        time: "12:05 PM",
        status: "busy",
    },
    {
        name: "User Name 3",
        ip: "192.168.1.3",
        time: "12:10 PM",
        status: "rejected",
    },
    {
        name: "User Name 4",
        ip: "192.168.1.4",
        time: "12:15 PM",
        status: "picked",
    },
    {
        name: "User Name 5",
        ip: "192.168.1.5",
        time: "12:20 PM",
        status: "rejected",
    },
    // Add more logs as needed
];

const logsElement = document.getElementById("logs");

// Function to render call logs
function renderCallLogs() {
    logsElement.innerHTML = ''; // Clear existing logs
    logs.forEach(log => {
        // Create log item container
        const logItem = document.createElement("div");
        logItem.className = "log-item";

        // Create log info container
        const logInfo = document.createElement("div");
        logInfo.className = "log-info";

        // Create name element
        const nameElement = document.createElement("span");
        nameElement.className = "name";
        nameElement.textContent = log.name;

        // Create IP element
        const ipElement = document.createElement("span");
        ipElement.className = "ip";
        ipElement.textContent = log.ip;

        // Create time element
        const timeElement = document.createElement("span");
        timeElement.className = "time";
        timeElement.textContent = log.time;

        // Append name, IP, and time to log info
        logInfo.appendChild(nameElement);
        logInfo.appendChild(ipElement);
        logInfo.appendChild(timeElement);

        // Create log status container
        const logStatus = document.createElement("div");
        logStatus.className = "log-status";

        // Create status dot
        const statusDot = document.createElement("div");
        statusDot.className = "status-dot";
        if (log.status === "picked") {
            statusDot.style.backgroundColor = "#03dac6"; // Green
        } else if (log.status === "busy") {
            statusDot.style.backgroundColor = "#ffb74d"; // Yellow
        } else if (log.status === "rejected") {
            statusDot.style.backgroundColor = "#cf6679"; // Red
        }

        // Create status text
        const statusText = document.createElement("span");
        if (log.status === "picked") {
            statusText.className = "status-picked";
            statusText.textContent = "Picked";
        } else if (log.status === "busy") {
            statusText.className = "status-busy";
            statusText.textContent = "Busy";
        } else if (log.status === "rejected") {
            statusText.className = "status-rejected";
            statusText.textContent = "Rejected";
        }

        // Append status dot and text to log status
        logStatus.appendChild(statusDot);
        logStatus.appendChild(statusText);

        // Append log info and status to log item
        logItem.appendChild(logInfo);
        logItem.appendChild(logStatus);

        // Append log item to logs container
        logsElement.appendChild(logItem);
    });
}

// Initialize the UI by rendering online devices and call logs
renderOnlineDevices();
renderCallLogs();