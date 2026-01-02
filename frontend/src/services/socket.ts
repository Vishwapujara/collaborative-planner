import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private currentProjectId: string | null = null;
  private currentTeamId: string | null = null;

  connect() {
  if (!this.socket) {
    const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    
    this.socket = io(socketUrl, {
      transports: ['websocket'],
      autoConnect: true,
    });

      this.socket.on('connect', () => {
        console.log('✅ Connected to WebSocket server');
      });

      this.socket.on('disconnect', () => {
        console.log('❌ Disconnected from WebSocket server');
      });

      this.socket.on('connect_error', (error) => {
        console.error('🔴 Connection error:', error);
      });
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Project rooms (for tasks)
  joinProject(projectId: string) {
    if (this.socket) {
      if (this.currentProjectId) {
        this.socket.emit('leave-project', this.currentProjectId);
      }
      
      this.socket.emit('join-project', projectId);
      this.currentProjectId = projectId;
      console.log(`👤 Joined project room: ${projectId}`);
    }
  }

  leaveProject(projectId: string) {
    if (this.socket) {
      this.socket.emit('leave-project', projectId);
      this.currentProjectId = null;
      console.log(`👋 Left project room: ${projectId}`);
    }
  }

  // ✨ NEW: Team rooms (for projects)
  joinTeam(teamId: string) {
    if (this.socket) {
      if (this.currentTeamId) {
        this.socket.emit('leave-team', this.currentTeamId);
      }
      
      this.socket.emit('join-team', teamId);
      this.currentTeamId = teamId;
      console.log(`👤 Joined team room: ${teamId}`);
    }
  }

  leaveTeam(teamId: string) {
    if (this.socket) {
      this.socket.emit('leave-team', teamId);
      this.currentTeamId = null;
      console.log(`👋 Left team room: ${teamId}`);
    }
  }

  // Task events
  onTaskCreated(callback: (task: any) => void) {
    if (this.socket) {
      this.socket.on('task-created', callback);
    }
  }

  onTaskUpdated(callback: (task: any) => void) {
    if (this.socket) {
      this.socket.on('task-updated', callback);
    }
  }

  onTaskDeleted(callback: (data: { id: number }) => void) {
    if (this.socket) {
      this.socket.on('task-deleted', callback);
    }
  }

  offTaskCreated(callback: (task: any) => void) {
    if (this.socket) {
      this.socket.off('task-created', callback);
    }
  }

  offTaskUpdated(callback: (task: any) => void) {
    if (this.socket) {
      this.socket.off('task-updated', callback);
    }
  }

  offTaskDeleted(callback: (data: { id: number }) => void) {
    if (this.socket) {
      this.socket.off('task-deleted', callback);
    }
  }

  // ✨ NEW: Project events
  onProjectCreated(callback: (project: any) => void) {
    if (this.socket) {
      this.socket.on('project-created', callback);
    }
  }

  onProjectUpdated(callback: (project: any) => void) {
    if (this.socket) {
      this.socket.on('project-updated', callback);
    }
  }

  onProjectDeleted(callback: (data: { id: number }) => void) {
    if (this.socket) {
      this.socket.on('project-deleted', callback);
    }
  }

  offProjectCreated(callback: (project: any) => void) {
    if (this.socket) {
      this.socket.off('project-created', callback);
    }
  }

  offProjectUpdated(callback: (project: any) => void) {
    if (this.socket) {
      this.socket.off('project-updated', callback);
    }
  }

  offProjectDeleted(callback: (data: { id: number }) => void) {
    if (this.socket) {
      this.socket.off('project-deleted', callback);
    }
  }

  getSocket() {
    return this.socket;
  }

  // Task rooms (for comments)
  joinTask(taskId: string) {
    if (this.socket) {
      this.socket.emit('join-task', taskId);
      console.log(`👤 Joined task room: ${taskId}`);
    }
  }

  leaveTask(taskId: string) {
    if (this.socket) {
      this.socket.emit('leave-task', taskId);
      console.log(`👋 Left task room: ${taskId}`);
    }
  }

  // Comment events
  onCommentCreated(callback: (comment: any) => void) {
    if (this.socket) {
      this.socket.on('comment-created', callback);
    }
  }

  onCommentDeleted(callback: (data: { id: number }) => void) {
    if (this.socket) {
      this.socket.on('comment-deleted', callback);
    }
  }

  offCommentCreated(callback: (comment: any) => void) {
    if (this.socket) {
      this.socket.off('comment-created', callback);
    }
  }

  offCommentDeleted(callback: (data: { id: number }) => void) {
    if (this.socket) {
      this.socket.off('comment-deleted', callback);
    }
  }
}

export default new SocketService();