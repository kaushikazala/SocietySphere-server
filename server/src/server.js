const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Initialize socket utility
const { init: initSocket } = require('./utils/socket');
initSocket(io);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import middlewares
const errorHandler = require('./middlewares/errorhandler');
const authMiddleware = require('./middlewares/auth');

// MongoDB Connection
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/societysphere';

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join user-specific room
  socket.on('join_user', (userId) => {
    socket.join(`user:${userId}`);
    console.log(`User ${userId} joined their personal room`);
  });

  // Join society room
  socket.on('join_society', (societyId) => {
    socket.join(`society:${societyId}`);
    console.log(`User joined society: ${societyId}`);
  });

  // Leave society room
  socket.on('leave_society', (societyId) => {
    socket.leave(`society:${societyId}`);
    console.log(`User left society: ${societyId}`);
  });

  // Handle real-time messaging
  socket.on('send_message', (data) => {
    const { societyId, message, senderId } = data;
    io.to(`society:${societyId}`).emit('new_message', {
      message,
      senderId,
      timestamp: new Date()
    });
  });

  // Handle forum post updates
  socket.on('forum_post_update', (data) => {
    const { societyId, postId, action } = data;
    io.to(`society:${societyId}`).emit('forum_update', {
      postId,
      action,
      timestamp: new Date()
    });
  });

  // Handle emergency alert acknowledgments
  socket.on('acknowledge_alert', (data) => {
    const { alertId, userId } = data;
    // You can store acknowledgments in database here
    console.log(`User ${userId} acknowledged alert ${alertId}`);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Routes
// app.use('/api/users', require('./routes/userRoutes'));
// app.use('/api/complaints', require('./routes/complaintRoutes'));
// app.use('/api/events', require('./routes/eventRoutes'));
// app.use('/api/notices', require('./routes/noticeRoutes'));
// app.use('/api/parking', require('./routes/parkingRoutes'));
// app.use('/api/bills', require('./routes/billRoutes'));
// app.use('/api/forum', require('./routes/forumRoutes'));
// app.use('/api/emergency', require('./routes/emergencyRoutes'));
// app.use('/api/visitors', require('./routes/visitorRoutes'));
// app.use('/api/documents', require('./routes/documentRoutes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    message: 'Server is running',
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Initialize cron jobs
const { initCronJobs } = require('./utils/cronJobs');
initCronJobs();

// Server startup
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Socket.IO server initialized`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    mongoose.connection.close();
  });
});

module.exports = app;
