# 🚀 Collaborative Work Planner

A real-time collaborative work management platform enabling distributed teams to manage projects and tasks with instant synchronization.

## ✨ Features

- 🔐 **Authentication & Authorization** - JWT-based auth with role-based access control
- 👥 **Team Management** - Create teams, invite members, manage permissions
- 📂 **Project Organization** - Organize work by team and project
- ✅ **Kanban Task Boards** - Visual task management with TODO, IN PROGRESS, DONE columns
- ⚡ **Real-Time Sync** - WebSocket-powered instant updates across all users
- 💬 **Task Comments** - Threaded discussions with real-time updates
- 🎯 **Task Assignment** - Assign tasks to team members
- 📊 **Priority Levels** - Low, Medium, High priority tasks
- 📅 **Due Dates** - Set and track task deadlines

## 🛠️ Tech Stack

**Frontend:**
- React 18 + TypeScript
- Tailwind CSS
- React Router
- Socket.io Client
- Axios

**Backend:**
- Node.js + Express
- TypeScript
- PostgreSQL
- Prisma ORM
- Socket.io (WebSockets)
- JWT Authentication
- Bcrypt

## 🚀 Live Demo

**Frontend:** [Coming soon]
**Backend API:** [Coming soon]

## 📸 Screenshots

[Add screenshots after deployment]

## 🏃 Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL 16

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Update .env with your database URL
npx prisma migrate dev
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

