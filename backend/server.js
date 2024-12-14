const express = require('express');
const cors = require('cors');
const http = require('http'); // To create the HTTP server
const { Server } = require('socket.io'); // Import Socket.io

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
        origin: ["http://localhost:5500", "http://127.0.0.1:5500"], // Allow both origins
        methods: ["GET", "POST"]
    }
});

// Handle Socket.io connections
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Listen for call responses from clients
    socket.on('callResponse', (data) => {
        const { ip, response } = data;
        console.log(`Received response from ${ip}: ${response}`);

        // Optional: Emit the response to another client or handle accordingly
        // For example, notify the initiator about the response
        // io.emit('callResponseToInitiator', { ip, response });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });

    // Optional: Handle more events here
});

// POST /api/call Endpoint
app.post('/api/call', (req, res) => {
    const { ip } = req.body;

    if (!ip) {
        return res.status(400).json({ error: 'IP address is required.' });
    }

    // Determine if 'ip' is single or multiple
    if (Array.isArray(ip)) {
        console.log(`Received call request for IPs: ${ip.join(', ')}`);
        io.emit('callMultiple', ip);
        res.status(200).json({ message: `Calls initiated for IPs: ${ip.join(', ')}` });
    } else {
        console.log(`Received call request for IP: ${ip}`);
        io.emit('callSingle', ip);
        res.status(200).json({ message: `Call initiated for IP: ${ip}` });
    }
});

// Start the Server
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});