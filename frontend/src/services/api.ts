import axios from 'axios';
import type { AuthResponse, Team, Project, Task, KanbanBoard, Comment } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests - check sessionStorage first
api.interceptors.request.use((config) => {
  // Try sessionStorage first (tab-specific)
  let token = sessionStorage.getItem('token');
  
  // Fallback to localStorage if "remember me" was checked
  if (!token) {
    const rememberMe = localStorage.getItem('rememberMe') === 'true';
    if (rememberMe) {
      token = localStorage.getItem('token');
      // Copy to sessionStorage for this tab
      if (token) {
        sessionStorage.setItem('token', token);
      }
    }
  }
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const authAPI = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post<AuthResponse>('/auth/register', data),
  
  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', data),
  
  getCurrentUser: () =>
    api.get<{ user: any }>('/auth/me'),
};

// Teams
export const teamsAPI = {
  getAll: () =>
    api.get<{ teams: Team[] }>('/teams'),
  
  getById: (id: number) =>
    api.get<{ team: Team }>(`/teams/${id}`),
  
  create: (data: { name: string; description?: string }) =>
    api.post<{ message: string; team: Team }>('/teams', data),
  
  addMember: (teamId: number, email: string) =>
    api.post(`/teams/${teamId}/members`, { email }),
};

// Projects
export const projectsAPI = {
  getByTeam: (teamId: number) =>
    api.get<{ projects: Project[] }>(`/projects/team/${teamId}`),
  
  getById: (id: number) =>
    api.get<{ project: Project }>(`/projects/${id}`),
  
  create: (data: { name: string; description?: string; teamId: number }) =>
    api.post<{ message: string; project: Project }>('/projects', data),
  
  update: (id: number, data: Partial<Project>) =>
    api.put<{ message: string; project: Project }>(`/projects/${id}`, data),
  
  delete: (id: number) =>
    api.delete<{ message: string }>(`/projects/${id}`),
};

// Tasks
export const tasksAPI = {
  getByProject: (projectId: number, filters?: Record<string, string>) =>
    api.get<{ tasks: Task[] }>(`/tasks/project/${projectId}`, { params: filters }),
  
  getKanban: (projectId: number) =>
    api.get<{ kanbanBoard: KanbanBoard }>(`/tasks/project/${projectId}/kanban`),
  
  getById: (id: number) =>
    api.get<{ task: Task }>(`/tasks/${id}`),
  
  create: (data: {
    title: string;
    description?: string;
    projectId: number;
    assigneeId?: number;
    priority?: string;
    dueDate?: string;
  }) =>
    api.post<{ message: string; task: Task }>('/tasks', data),
  
  update: (id: number, data: Partial<Task>) =>
    api.put<{ message: string; task: Task }>(`/tasks/${id}`, data),
  
  delete: (id: number) =>
    api.delete<{ message: string }>(`/tasks/${id}`),
};

export const commentsAPI = {
  getByTask: (taskId: number) =>
    api.get<{ comments: Comment[] }>(`/comments/task/${taskId}`),
  
  create: (data: { content: string; taskId: number }) =>
    api.post<{ message: string; comment: Comment }>('/comments', data),
  
  delete: (id: number) =>
    api.delete<{ message: string }>(`/comments/${id}`),
};

export default api;