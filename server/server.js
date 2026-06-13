import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';

// Security utilities
import User from './models/User.js';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';

// Configurations
import connectDB from './config/db.js';
import errorHandler from './middleware/error.js';
import { apiLimiter } from './middleware/rateLimiter.js';

// Route imports
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import postRoutes from './routes/post.js';
import commentRoutes from './routes/comment.js';
import storyRoutes from './routes/story.js';
import reelRoutes from './routes/reel.js';
import messageRoutes from './routes/message.js';
import notificationRoutes from './routes/notification.js';
import adminRoutes from './routes/admin.js';
import reportRoutes from './routes/report.js';

// Load env variables
dotenv.config();

// Connect to Database
connectDB().then(async () => {
  try {
    // 1. Migrate avatar paths
    await User.updateMany(
      { profilePic: '/uploads/default-avatar.png' },
      { profilePic: '/uploads/default-avatar.svg' }
    );
    
    // 2. Rename author -> user field in posts and reels collections for legacy compliance
    const db = mongoose.connection.db;
    await db.collection('posts').updateMany(
      { author: { $exists: true } },
      { $rename: { author: 'user' } }
    );
    await db.collection('reels').updateMany(
      { author: { $exists: true } },
      { $rename: { author: 'user' } }
    );
  } catch (err) {
    console.error('Database migrations error:', err);
  }
});

const app = express();
const server = http.createServer(app);

// Socket.io integration
const io = new Server(server, {
  cors: {
    origin: '*', // We can restrict to frontend URL in production
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

global.io = io;

// Setup online users collection
const onlineUsers = new Map(); // userId -> socketId

// Socket.io connection logic
io.on('connection', (socket) => {
  let userId = null;

  // Authenticate socket connection
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey_gminsta_2026');
      userId = decoded.id;
      onlineUsers.set(userId, socket.id);
      socket.join(userId);
      console.log(`Socket client connected: User ${userId}`);

      // Broadcast list of online user IDs
      io.emit('onlineUsers', Array.from(onlineUsers.keys()));
    } catch (err) {
      console.error('Socket authentication failed:', err.message);
    }
  }

  // Real-time typing indicators
  socket.on('typing', ({ conversationId, receiverId }) => {
    if (receiverId) {
      io.to(receiverId).emit('typing', { conversationId, senderId: userId });
    }
  });

  socket.on('stopTyping', ({ conversationId, receiverId }) => {
    if (receiverId) {
      io.to(receiverId).emit('stopTyping', { conversationId, senderId: userId });
    }
  });

  // Real-time message reactions
  socket.on('messageReaction', ({ messageId, conversationId, receiverId, reaction }) => {
    if (receiverId) {
      io.to(receiverId).emit('messageReaction', { messageId, conversationId, reaction });
    }
  });

  // Client disconnecting
  socket.on('disconnect', () => {
    if (userId) {
      onlineUsers.delete(userId);
      console.log(`Socket client disconnected: User ${userId}`);
      io.emit('onlineUsers', Array.from(onlineUsers.keys()));
    }
  });
});

// Middleware to expose io and onlineUsers to express routes
app.use((req, res, next) => {
  req.io = io;
  req.onlineUsers = onlineUsers;

  // Intercept json responses to automatically prepend backend host to local uploads paths
  const originalSend = res.send;
  res.send = function (body) {
    if (typeof body === 'string' && (res.getHeader('content-type')?.includes('application/json') || res.getHeader('content-type')?.includes('text/html'))) {
      try {
        const host = `${req.protocol}://${req.get('host')}`;
        const replaced = body.replace(/\"\/uploads\//g, `"${host}/uploads/`);
        return originalSend.call(this, replaced);
      } catch (err) {
        console.error('JSON response URL replacement error:', err);
      }
    }
    return originalSend.call(this, body);
  };

  next();
});

// Standard Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// HTTP Header Security
app.use(
  helmet({
    crossOriginResourcePolicy: false, // Allows cross-origin image requests
  })
);

// Prevent NoSQL injections
app.use(mongoSanitize());

// Prevent XSS attacks
app.use(xss());

// Logger for development
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Ensure static public uploads are served
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsPath = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadsPath) && !process.env.VERCEL) {
  try {
    fs.mkdirSync(uploadsPath, { recursive: true });
  } catch (err) {
    console.error('Error creating uploads folder:', err.message);
  }
}
app.use('/uploads', express.static(uploadsPath));

// Default avatars setup
const base64Avatar = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUtEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const defaultSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="100%" height="100%" fill="#EAEAEA"/><circle cx="12" cy="8" r="4" fill="#A0A0A0"/><path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" fill="#A0A0A0"/></svg>`;
const groupSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="100%" height="100%" fill="#EAEAEA"/><circle cx="9" cy="9" r="3" fill="#A0A0A0"/><circle cx="15" cy="9" r="3" fill="#A0A0A0"/><path d="M2 20c0-3.3 2.7-6 6-6h8c3.3 0 6 2.7 6 6" fill="#A0A0A0"/></svg>`;

try {
  const avatarPath = path.join(uploadsPath, 'default-avatar.png');
  if (!fs.existsSync(avatarPath) || fs.statSync(avatarPath).size === 0) {
    fs.writeFileSync(avatarPath, Buffer.from(base64Avatar, 'base64'));
  }
  const avatarSvgPath = path.join(uploadsPath, 'default-avatar.svg');
  if (!fs.existsSync(avatarSvgPath) || fs.statSync(avatarSvgPath).size === 0) {
    fs.writeFileSync(avatarSvgPath, defaultSvg);
  }

  const groupAvatarPath = path.join(uploadsPath, 'group-avatar.png');
  if (!fs.existsSync(groupAvatarPath) || fs.statSync(groupAvatarPath).size === 0) {
    fs.writeFileSync(groupAvatarPath, Buffer.from(base64Avatar, 'base64'));
  }
  const groupAvatarSvgPath = path.join(uploadsPath, 'group-avatar.svg');
  if (!fs.existsSync(groupAvatarSvgPath) || fs.statSync(groupAvatarSvgPath).size === 0) {
    fs.writeFileSync(groupAvatarSvgPath, groupSvg);
  }
} catch (err) {
  console.warn('Could not write default avatars to disk (read-only filesystem):', err.message);
}

// General API request limits
app.use('/api/', apiLimiter);

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/reels', reelRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);

// Base Route
app.get('/', (req, res) => {
  res.send('GMinsta API Server Running');
});

// Global Error Handler
app.use(errorHandler);

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`GMinsta Server running in development mode on port ${PORT}`);
  });
}

export default app;
