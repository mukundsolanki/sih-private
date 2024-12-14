// Sample onlineList data
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

// Listen for 'callSingle' event from the server
socket.on('callSingle', (ip) => {
    console.log(`Received callSingle event for IP: ${ip}`);
    showCallModal(ip);
});

// Listen for 'callMultiple' event from the server
socket.on('callMultiple', (ips) => {
    console.log(`Received callMultiple event for IPs: ${ips.join(', ')}`);
    showCallModal(ips);
});

// Function to display the call modal
function showCallModal(callerInfo) {
    if (Array.isArray(callerInfo)) {
        callStatusElement.innerHTML = `Incoming Calls from:<br>${callerInfo.join('<br>')}`;
    } else {
        callStatusElement.textContent = `Incoming Call from ${callerInfo}`;
    }
    callModal.style.display = 'flex';
}

// Function to hide the call modal
function hideCallModal() {
    callModal.style.display = 'none';
    callStatusElement.textContent = 'Incoming Call...';
}

// Function to extract IP from the call status element
function extractIpFromStatus() {
    const text = callStatusElement.textContent;
    const ipMatch = text.match(/from\s([0-9.]+)/);
    return ipMatch ? ipMatch[1] : 'Unknown IP';
}

// Event listener for close (X) button
closeModal.addEventListener('click', hideCallModal);

// Event listener for Pickup button
pickupButton.addEventListener('click', () => {
    console.log('Call accepted.');
    // Emit 'callResponse' to the server
    socket.emit('callResponse', { ip: extractIpFromStatus(), response: 'accepted' });
    // Implement additional pickup call logic here
    hideCallModal();
});

// Event listener for Reject button
rejectButton.addEventListener('click', () => {
    console.log('Call rejected.');
    // Emit 'callResponse' to the server
    socket.emit('callResponse', { ip: extractIpFromStatus(), response: 'rejected' });
    // Implement additional reject call logic here
    hideCallModal();
});

function launchVideoChat() {
    // Open the video chat in a new window with maximum dimensions
    const width = screen.width;
    const height = screen.height;
    const videoChatWindow = window.open(
        "http://192.168.8.67:3012/video-chat.html",
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

// Array to keep track of selected devices
const selectedDevices = [];

// Flag to indicate if selection mode is active
let selectionMode = false;

// Function to render online devices
function renderOnlineDevices() {
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
        // Optionally, open the call modal immediately
        // openCallModal();
        // After calling, clear selections
        clearSelections();
    }
}

// Function to call a single device
function callSingle(ip) {
    const url = `http://${ip}:3000/api/call`;
    console.log(`Initiating call to ${url}`);

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ip: ip })
    })
        .then(response => response.json())
        .then(data => {
            console.log('Call initiated:', data);
            // Update call status or handle response

            callStatusElement.textContent = `Call initiated for IP: ${ip}`;
        })
        .catch(error => {
            console.error('Error initiating call:', error);
            callStatusElement.textContent = `Error initiating call for IP: ${ip}`;
        });
}

// Function to call multiple devices without waiting for responses
function callMultiple(ips) {
    ips.forEach(ip => {
        const url = `http://${ip}:3000/api/call`;
        console.log(`Initiating call to ${url}`);

        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ip: ip })
        })
            .then(response => response.json())
            .then(data => {
                console.log(`Call initiated for ${ip}:`, data);

                // Optionally handle individual responses
            })
            .catch(error => {
                console.error(`Error initiating call for ${ip}:`, error);
            });
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

// Function to open the Call Modal
function openCallModal() {
    callStatusElement.textContent = "Calling...";
    callModal.style.display = "flex";
}

// Function to open the Call Modal for a single device
function openCallModalForDevice(device) {
    callStatusElement.textContent = "Calling...";
    callModal.style.display = "flex";
    callSingle(device.ip); // Invoke callSingle with the device's IP
}

// Function to close the Call Modal
function closeCallModal() {
    callModal.style.display = "none";
    // Optionally, clear selection if any
    clearSelections();
}

// Add event listeners to action buttons
callButton.addEventListener("click", handleCall);
cancelButton.addEventListener("click", handleCancel);

// Add event listener to close modal
closeModal.addEventListener("click", closeCallModal);

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