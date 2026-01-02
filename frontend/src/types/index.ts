export interface User {
  id: number;
  email: string;
  name: string;
  createdAt: string;
}

export interface Team {
  id: number;
  name: string;
  description?: string;
  creatorId: number;
  createdAt: string;
  creator: User;
  members: TeamMember[];
  _count?: {
    members: number;
  };
}

export interface TeamMember {
  id: number;
  role: string;
  user: User;
  joinedAt: string;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  status: string;
  teamId: number;
  createdAt: string;
  team: {
    id: number;
    name: string;
  };
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  projectId: number;
  assigneeId?: number;
  createdAt: string;
  updatedAt: string;
  assignee?: User;
  project?: {
    id: number;
    name: string;
  };
}

export interface KanbanBoard {
  TODO: Task[];
  IN_PROGRESS: Task[];
  DONE: Task[];
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface Comment {
  id: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  taskId: number;
  authorId: number;
  author: User;
  task?: {
    id: number;
    title: string;
  };
}