import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';

// Import routes
import authRoutes from './routes/authRoutes';
import teamRoutes from './routes/teamRoutes';
import projectRoutes from './routes/projectRoutes';
import taskRoutes from './routes/taskRoutes';
import commentRoutes from './routes/commentRoutes';
import aiRoutes from './routes/aiRoutes';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;
// Allowed origins for CORS
const allowedOrigins = [
  'http://localhost:5173',
  'https://collaborative-planner.vercel.app', // ✨ Add your Vercel URL
];

// Socket.io setup with CORS
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// Make io accessible in routes
app.set('io', io);

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    message: 'Server is running!',
    timestamp: new Date().toISOString(),
  });
});

// Database test
app.get('/api/test-db', async (req, res) => {
  try {
    await prisma.$connect();
    const userCount = await prisma.user.count();

    res.json({
      message: 'Database connected successfully!',
      userCount: userCount,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/ai', aiRoutes);
// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);

  // Join project room
  socket.on('join-project', (projectId: string) => {
    socket.join(`project-${projectId}`);
    console.log(`👤 User ${socket.id} joined project-${projectId}`);
  });

  // Leave project room
  socket.on('leave-project', (projectId: string) => {
    socket.leave(`project-${projectId}`);
    console.log(`👋 User ${socket.id} left project-${projectId}`);
  });

  // Join team room
  socket.on('join-team', (teamId: string) => {
    socket.join(`team-${teamId}`);
    console.log(`👤 User ${socket.id} joined team-${teamId}`);
  });

  // Join task room (for comments)
  socket.on('join-task', (taskId: string) => {
    socket.join(`task-${taskId}`);
    console.log(`👤 User ${socket.id} joined task-${taskId}`);
  });

  // Leave team room
  socket.on('leave-team', (teamId: string) => {
    socket.leave(`team-${teamId}`);
    console.log(`👋 User ${socket.id} left team-${teamId}`);
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
  });
});

// Export io for use in controllers
export { io };

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  io.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  io.close();
  process.exit(0);
});

httpServer.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket server ready`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Auth routes: http://localhost:${PORT}/api/auth/*`);
  console.log(`👥 Team routes: http://localhost:${PORT}/api/teams/*`);
  console.log(`📂 Project routes: http://localhost:${PORT}/api/projects/*`);
  console.log(`✅ Task routes: http://localhost:${PORT}/api/tasks/*`);
  console.log(`💬 Comment routes: http://localhost:${PORT}/api/comments/*`); 

});