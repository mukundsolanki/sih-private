const express = require('express');
const cors = require('cors');
const http = require('http'); // To create the HTTP server
const { Server } = require('socket.io'); // Import Socket.io
const { v4: uuidv4 } = require('uuid'); // UUID for unique Call IDs

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON request bodies

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io server with updated CORS settings
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins
        methods: ["GET", "POST"]
    }
});

// In-memory map to track ongoing calls
const ongoingCalls = new Map();

// In-memory map to associate IPs with socket IDs
const ipToSocketId = new Map();

// Handle Socket.io connections
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Example client-side registration
    socket.emit('register', { ip: '192.168.1.2' });

    // Listen for device registration with IP
    socket.on('register', (data) => {
        const { ip } = data;
        if (ip) {
            ipToSocketId.set(ip, socket.id);
            console.log(`Device with IP ${ip} registered with socket ID ${socket.id}`);
        } else {
            console.log(`Device connected without IP: ${socket.id}`);
        }
    });

    // Listen for call responses from clients
    socket.on('callResponse', (data) => {
        const { callId, response } = data;
        console.log(`Received response for Call ID ${callId}: ${response}`);

        if (ongoingCalls.has(callId)) {
            const { resolve, timeout } = ongoingCalls.get(callId);
            clearTimeout(timeout); // Clear the timeout
            resolve(response); // Resolve the promise with the user's response
            ongoingCalls.delete(callId); // Remove the call from the map
        } else {
            console.log(`No ongoing call found for Call ID ${callId}`);
        }
    });

    socket.on('incomingCall', (data) => {
        const { callId, ip } = data;
        // Display modal or notification to the user with Accept/Reject options
        // On user action:
        // For example, if accepted:
        socket.emit('callResponse', { callId, response: 'accepted' });
        // If rejected:
        // socket.emit('callResponse', { callId, response: 'rejected' });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Remove the socket from ipToSocketId map
        for (let [ip, socketId] of ipToSocketId.entries()) {
            if (socketId === socket.id) {
                ipToSocketId.delete(ip);
                console.log(`Device with IP ${ip} disconnected and removed from tracking.`);
                break;
            }
        }
    });

    // Optional: Handle more events here
});

// POST /api/call Endpoint
app.post('/api/call', async (req, res) => {
    const { ip } = req.body;

    if (!ip) {
        return res.status(400).json({ error: 'IP address is required.' });
    }

    // Check if the target IP is registered
    if (!ipToSocketId.has(ip)) {
        return res.status(404).json({ error: 'Device with the provided IP is not connected.' });
    }

    // Generate a unique Call ID
    const callId = uuidv4();

    // Function to handle the response with a timeout
    const waitForResponse = () => {
        return new Promise((resolve, reject) => {
            // Set a timeout for the response (15 seconds)
            const timeout = setTimeout(() => {
                ongoingCalls.delete(callId);
                reject(new Error('Call response timed out.'));
            }, 15000); // 15,000 ms = 15 seconds

            // Store the resolver and timeout in the map
            ongoingCalls.set(callId, { resolve, timeout });
        });
    };

    try {
        // Emit the call event to the specific device with Call ID
        console.log(`Initiating call to IP: ${ip} with Call ID: ${callId}`);
        io.to(ipToSocketId.get(ip)).emit('incomingCall', { callId, ip });

        // Wait for the user's response
        const userResponse = await waitForResponse();

        // Respond based on the user's response
        if (userResponse === 'accepted') {
            res.status(200).json({ message: `Call accepted by IP: ${ip}` });
        } else if (userResponse === 'rejected') {
            res.status(403).json({ message: `Call rejected by IP: ${ip}` });
        } else {
            res.status(400).json({ message: `Unknown response from IP: ${ip}` });
        }
    } catch (error) {
        console.error(`Error handling call for IP ${ip}:`, error.message);
        res.status(408).json({ error: 'Call response timed out or an error occurred.' });
    }
});

// Start the Server
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});