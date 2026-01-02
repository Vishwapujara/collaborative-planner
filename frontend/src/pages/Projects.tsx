import React, { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';
import { projectsAPI, teamsAPI } from '../services/api';
import socketService from '../services/socket';
import type { Project, Team } from '../types';
import { FolderKanban, Plus, ChevronRight, CheckCircle, Archive, Circle, Wifi, WifiOff, Trash2 } from 'lucide-react';

export const Projects: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const fetchProjects = useCallback(async () => {
    if (!teamId) return;
    try {
      const response = await projectsAPI.getByTeam(parseInt(teamId));
      setProjects(response.data.projects);
      console.log('📊 Loaded projects:', response.data.projects);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  const fetchTeam = useCallback(async () => {
    if (!teamId) return;
    try {
      const response = await teamsAPI.getById(parseInt(teamId));
      setTeam(response.data.team);
    } catch (error) {
      console.error('Error fetching team:', error);
    }
  }, [teamId]);

  // Real-time handlers
  const handleProjectCreated = useCallback((project: Project) => {
    console.log('🆕 Real-time: Project created', project);
    setProjects(prev => [...prev, project]);
  }, []);

  const handleProjectUpdated = useCallback((project: Project) => {
    console.log('🔄 Real-time: Project updated', project);
    setProjects(prev => 
      prev.map(p => p.id === project.id ? project : p)
    );
  }, []);

  const handleProjectDeleted = useCallback((data: { id: number }) => {
    console.log('🗑️ Real-time: Project deleted', data.id);
    setProjects(prev => prev.filter(p => p.id !== data.id));
  }, []);

  // Setup WebSocket
  useEffect(() => {
    if (!teamId) return;

    console.log('🔌 Setting up WebSocket for team:', teamId);

    const socket = socketService.connect();
    
    socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
      setConnected(false);
    });

    // Join team room
    socketService.joinTeam(teamId);

    // Subscribe to project events
    socketService.onProjectCreated(handleProjectCreated);
    socketService.onProjectUpdated(handleProjectUpdated);
    socketService.onProjectDeleted(handleProjectDeleted);

    // Fetch initial data
    fetchProjects();
    fetchTeam();

    // Cleanup
    return () => {
      console.log('🧹 Cleaning up project socket listeners');
      socketService.offProjectCreated(handleProjectCreated);
      socketService.offProjectUpdated(handleProjectUpdated);
      socketService.offProjectDeleted(handleProjectDeleted);
      socketService.leaveTeam(teamId);
    };
  }, [teamId, fetchProjects, fetchTeam, handleProjectCreated, handleProjectUpdated, handleProjectDeleted]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await projectsAPI.create({ ...formData, teamId: parseInt(teamId!) });
      setShowCreateModal(false);
      setFormData({ name: '', description: '' });
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const handleStatusChange = async (projectId: number, newStatus: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      console.log(`🔄 Changing project ${projectId} status to ${newStatus}`);
      await projectsAPI.update(projectId, { status: newStatus });
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update status');
    }
  };

  const openDeleteModal = (project: Project, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setProjectToDelete(project);
    setShowDeleteModal(true);
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;

    try {
      await projectsAPI.delete(projectToDelete.id);
      setShowDeleteModal(false);
      setProjectToDelete(null);
      // WebSocket will handle removal from list
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete project');
    }
  };

  const isAdmin = () => {
    if (!team || !user) return false;
    return team.members.some(m => m.user.id === user.id && m.role === 'admin');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'archived':
        return <Archive className="h-4 w-4" />;
      default:
        return <Circle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'archived':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
              {connected ? (
                <span className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                  <Wifi className="h-4 w-4" />
                  Live
                </span>
              ) : (
                <span className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-1 rounded-full">
                  <WifiOff className="h-4 w-4" />
                  Offline
                </span>
              )}
            </div>
            <p className="mt-2 text-gray-600">
              {team?.name && `${team.name} - `}
              Manage your team's projects.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Project
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="card text-center py-12">
            <FolderKanban className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-600 mb-4">Create your first project to get started.</p>
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
              Create Your First Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="card hover:shadow-lg transition-shadow group relative"
              >
                {/* Delete Button - Top Right (Admin Only) */}
                {isAdmin() && (
                  <button
                    onClick={(e) => openDeleteModal(project, e)}
                    className="absolute top-4 right-4 p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete project"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}

                <Link to={`/projects/${project.id}/kanban`} className="block">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <FolderKanban className="h-6 w-6 text-green-600" />
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.name}</h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {project.description || 'No description'}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{project.team.name}</span>
                  </div>
                </Link>

                {/* Status Badge - Different UI for Admin vs Member */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  {isAdmin() ? (
                    // ADMIN: Can change status via dropdown
                    <>
                      <div className="relative group/status">
                        <div className={`flex items-center gap-2 px-3 py-2 rounded border cursor-pointer ${getStatusColor(project.status)}`}>
                          {getStatusIcon(project.status)}
                          <span className="text-xs font-medium capitalize">{project.status}</span>
                          <span className="text-xs opacity-50 ml-auto">▼</span>
                        </div>
                        
                        {/* Dropdown Menu */}
                        <div className="absolute bottom-full left-0 mb-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover/status:opacity-100 group-hover/status:visible transition-all z-10">
                          {project.status !== 'active' && (
                            <button
                              onClick={(e) => handleStatusChange(project.id, 'active', e)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-700 hover:bg-blue-50 rounded-t-lg"
                            >
                              <Circle className="h-4 w-4" />
                              Mark as Active
                            </button>
                          )}
                          {project.status !== 'completed' && (
                            <button
                              onClick={(e) => handleStatusChange(project.id, 'completed', e)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-700 hover:bg-green-50"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Mark as Completed
                            </button>
                          )}
                          {project.status !== 'archived' && (
                            <button
                              onClick={(e) => handleStatusChange(project.id, 'archived', e)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-b-lg"
                            >
                              <Archive className="h-4 w-4" />
                              Archive Project
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        💡 Hover to change status
                      </p>
                    </>
                  ) : (
                    // MEMBER: Read-only status badge (no dropdown)
                    <>
                      <div className={`flex items-center gap-2 px-3 py-2 rounded border ${getStatusColor(project.status)}`}>
                        {getStatusIcon(project.status)}
                        <span className="text-xs font-medium capitalize">{project.status}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Status managed by team admins
                      </p>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Project Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Create New Project</h2>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Name
                  </label>
                  <input
                    type="text"
                    required
                    className="input"
                    placeholder="Mobile App Development"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="Build our new mobile app"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Create Project
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && projectToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-100 rounded-lg">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Delete Project</h2>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
                <p className="text-sm text-red-800">
                  Are you sure you want to delete <strong>"{projectToDelete.name}"</strong>?
                </p>
                <p className="text-xs text-red-700 mt-2">
                  ⚠️ All tasks in this project will also be deleted.
                </p>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setProjectToDelete(null);
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteProject}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Project
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};