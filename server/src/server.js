const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const socketIo = require("socket.io");
require("dotenv").config();

const requiredEnv = ["MONGODB_URI", "JWT_SECRET", "JWT_REFRESH_SECRET"];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length) {
  throw new Error(
    `Missing required environment variables: ${missingEnv.join(", ")}. ` +
      `Create a .env file or set these variables before starting the server.`
  );
}

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5176",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Initialize socket utility
const { init: initSocket } = require("./utils/socket");
initSocket(io);

// Middleware
const clientOrigins = [
  process.env.CLIENT_URL || "http://localhost:5176",
  "http://localhost:5173",
  "http://localhost:5174",
].filter(Boolean);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || clientOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Import middlewares
const errorHandler = require("./middlewares/errorhandler");
const authMiddleware = require("./middlewares/auth");

// MongoDB Connection
const mongoURI = process.env.MONGODB_URI;

mongoose
  .connect(mongoURI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join user-specific room
  socket.on("join_user", (userId) => {
    socket.join(`user:${userId}`);
    console.log(`User ${userId} joined their personal room`);
  });

  // Join society room
  socket.on("join_society", (societyId) => {
    socket.join(`society:${societyId}`);
    console.log(`User joined society: ${societyId}`);
  });

  // Leave society room
  socket.on("leave_society", (societyId) => {
    socket.leave(`society:${societyId}`);
    console.log(`User left society: ${societyId}`);
  });

  // Handle real-time messaging
  socket.on("send_message", (data) => {
    const { societyId, message, senderId } = data;
    io.to(`society:${societyId}`).emit("new_message", {
      message,
      senderId,
      timestamp: new Date(),
    });
  });

  // Handle forum post updates
  socket.on("forum_post_update", (data) => {
    const { societyId, postId, action } = data;
    io.to(`society:${societyId}`).emit("forum_update", {
      postId,
      action,
      timestamp: new Date(),
    });
  });

  // Handle emergency alert acknowledgments
  socket.on("acknowledge_alert", (data) => {
    const { alertId, userId } = data;
    // You can store acknowledgments in database here
    console.log(`User ${userId} acknowledged alert ${alertId}`);
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/complaints", require("./routes/complaints"));
app.use("/api/documents", require("./routes/documents"));
app.use("/api/emergency", require("./routes/emergency"));
app.use("/api/events", require("./routes/events"));
app.use("/api/forum", require("./routes/forum"));
app.use("/api/maintenance", require("./routes/maintenance"));
app.use("/api/notices", require("./routes/notices"));
app.use("/api/parking", require("./routes/parking"));
app.use("/api/societies", require("./routes/societies"));
app.use("/api/visitors", require("./routes/visitors"));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    message: "Server is running",
    timestamp: new Date(),
    uptime: process.uptime(),
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Initialize cron jobs
const { initCronJobs } = require("./utils/cronJobs");
initCronJobs();

// Server startup
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server is running`);
  console.log(`Socket.IO server initialized`); 
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Server closed");
    mongoose.connection.close();
  });
});

module.exports = app;
