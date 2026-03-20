const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Connect to MongoDB
connectDB();

// Socket.io Live Telemetry
io.on('connection', (socket) => {
  console.log(`📡 Telemetry Socket Connected: ${socket.id}`);
  
  socket.on('live-telemetry', (data) => {
    // This connects the Strivio Core Engine to the backend
    console.log(`🏋️ Telemetry [${data.exercise}]: Reps=${data.reps}, Acc=${data.accuracy}%, Fatigue=${data.fatigue}`);
  });

  socket.on('disconnect', () => {
    console.log(`📉 Telemetry Socket Disconnected: ${socket.id}`);
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api', require('./routes/api'));
app.use('/api/tracking', require('./routes/tracking'));
app.use('/api/integrations', require('./routes/integrations'));
app.use('/api/auth', require('./routes/mfa'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Strivio API', timestamp: new Date().toISOString() });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Strivio API server running on port ${PORT}`);
});

