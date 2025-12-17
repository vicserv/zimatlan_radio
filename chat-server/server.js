const { Server } = require("socket.io");
const { createClient } = require("redis");

const PORT = process.env.PORT || 3001;
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const io = new Server(PORT, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"]
  }
});

const redisClient = createClient({ url: REDIS_URL });

redisClient.on('error', (err) => console.log('Redis Client Error', err));

(async () => {
  await redisClient.connect();
  console.log(`Chat Server running on port ${PORT}`);
  console.log(`Connected to Redis at ${REDIS_URL}`);
})();

// Stores active sessions: deviceId -> { username: string, sockets: Set<string> }
const deviceSessions = new Map();
const messageHistory = []; // Keep last 5 messages in memory

io.on("connection", (socket) => {
  console.log("New connection:", socket.id);

  socket.on("join", (data) => {
    // Handle both old (string) and new (object) formats for backward compatibility during dev
    const username = typeof data === 'string' ? data : data.username;
    const deviceId = typeof data === 'object' && data.deviceId ? data.deviceId : `legacy_${socket.id}`; // Fallback for clients without id

    // Store deviceId on socket for disconnect handling
    socket.data.deviceId = deviceId;

    if (!deviceSessions.has(deviceId)) {
      deviceSessions.set(deviceId, { username, sockets: new Set() });
    }
    
    // Add this socket to the device session
    const session = deviceSessions.get(deviceId);
    session.sockets.add(socket.id);
    // Update username if it changed (last write wins)
    session.username = username;

    broadcastUserList();

    console.log(`User joined: ${username} (Device: ${deviceId}). Sending history of ${messageHistory.length} messages.`);
    // Send history to the new user
    socket.emit("chat_history", messageHistory);
  });

  socket.on("send_message", (data) => {
    const { username, text } = data;
    console.log('[DEBUG] Saving message. Current Socket DeviceId:', socket.data.deviceId);
    const message = {
      id: Date.now(),
      username,
      text,
      timestamp: new Date().toISOString(),
      deviceId: socket.data.deviceId, // Link message to device for renaming
      reactions: {} // Initialize reactions
    };
    
    // Store in history (keep last 20)
    messageHistory.push(message);
    if (messageHistory.length > 20) {
      messageHistory.shift();
    }
    
    console.log(`Message from ${username}: ${text}. History size now: ${messageHistory.length}`);

    io.emit("receive_message", message);
  });

  socket.on("react_message", ({ messageId, reaction, deviceId }) => {
     const msg = messageHistory.find(m => m.id === messageId);
     if (msg) {
        if (!msg.reactions) msg.reactions = {};
        if (!msg.reactions[reaction]) msg.reactions[reaction] = [];
        
        const userIndex = msg.reactions[reaction].indexOf(deviceId);
        if (userIndex === -1) {
            msg.reactions[reaction].push(deviceId); // Add reaction
        } else {
            msg.reactions[reaction].splice(userIndex, 1); // Remove reaction
        }
        
        io.emit("message_updated", msg);
     }
  });

  socket.on("typing", (username) => {
    socket.broadcast.emit("user_typing", { username, deviceId: socket.data.deviceId });
  });

  socket.on("stop_typing", () => {
    socket.broadcast.emit("user_stop_typing", { deviceId: socket.data.deviceId });
  });

  socket.on("change_username", (newUsername) => {
    const deviceId = socket.data.deviceId;
    console.log(`[DEBUG] Attempting rename for device: ${deviceId} -> ${newUsername}`);
    
    if (deviceId && deviceSessions.has(deviceId)) {
      const session = deviceSessions.get(deviceId);
      session.username = newUsername;
      
      let updateCount = 0;
      // Retroactively update history for this user
      messageHistory.forEach(msg => {
        console.log(`[DEBUG] Checking msg ${msg.id}: msgDeviceId=${msg.deviceId} vs current=${deviceId}`);
        if (msg.deviceId === deviceId) {
          msg.username = newUsername;
          updateCount++;
        }
      });
      
      console.log(`[DEBUG] Updated ${updateCount} messages based on deviceId.`);

      broadcastUserList();
      
      // Update everyone's view with the new names
      io.emit("refresh_history", messageHistory);
    } else {
        console.log(`[DEBUG] Session not found or deviceId missing for socket ${socket.id}`);
    }
  });

  socket.on("disconnect", () => {
    const deviceId = socket.data.deviceId;
    if (deviceId && deviceSessions.has(deviceId)) {
      const session = deviceSessions.get(deviceId);
      session.sockets.delete(socket.id);
      
      if (session.sockets.size === 0) {
         deviceSessions.delete(deviceId);
         broadcastUserList();
      }
    }
    console.log("Disconnected:", socket.id);
  });

  function broadcastUserList() {
    const uniqueUsers = Array.from(deviceSessions.values()).map(s => s.username);
    io.emit("update_users", uniqueUsers);
  }
});
