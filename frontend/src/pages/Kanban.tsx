import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { tasksAPI } from '../services/api';
import socketService from '../services/socket';
import type { KanbanBoard, Task } from '../types';
import { Plus, Wifi, WifiOff } from 'lucide-react';
import { getPriorityColor } from '../utils/helpers';
import { TaskDetailModal } from '../components/task/TaskDetailModal';

export const Kanban: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [board, setBoard] = useState<KanbanBoard>({ TODO: [], IN_PROGRESS: [], DONE: [] });
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
  });

  // Fetch initial kanban data
  const fetchKanban = useCallback(async () => {
    if (!projectId) return;
    
    try {
      const response = await tasksAPI.getKanban(parseInt(projectId));
      setBoard(response.data.kanbanBoard);
      console.log('📊 Loaded kanban board:', response.data.kanbanBoard);
    } catch (error) {
      console.error('Error fetching kanban:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Handle real-time task created
  const handleTaskCreated = useCallback((task: Task) => {
    console.log('🆕 Real-time: Task created', task);
    setBoard((prev) => ({
      ...prev,
      [task.status]: [...prev[task.status], task],
    }));
  }, []);

  // Handle real-time task updated
  const handleTaskUpdated = useCallback((task: Task) => {
    console.log('🔄 Real-time: Task updated', task);
    
    setBoard((prev) => {
      // Remove from all columns
      const newBoard = {
        TODO: prev.TODO.filter(t => t.id !== task.id),
        IN_PROGRESS: prev.IN_PROGRESS.filter(t => t.id !== task.id),
        DONE: prev.DONE.filter(t => t.id !== task.id),
      };
      
      // Add to correct column
      return {
        ...newBoard,
        [task.status]: [...newBoard[task.status], task],
      };
    });

    // Update selected task if it's the one that was updated
    if (selectedTask && selectedTask.id === task.id) {
      setSelectedTask(task);
    }
  }, [selectedTask]);

  // Handle real-time task deleted
  const handleTaskDeleted = useCallback((data: { id: number }) => {
    console.log('🗑️ Real-time: Task deleted', data.id);
    setBoard((prev) => ({
      TODO: prev.TODO.filter(t => t.id !== data.id),
      IN_PROGRESS: prev.IN_PROGRESS.filter(t => t.id !== data.id),
      DONE: prev.DONE.filter(t => t.id !== data.id),
    }));

    // Close modal if deleted task was open
    if (selectedTask && selectedTask.id === data.id) {
      setSelectedTask(null);
    }
  }, [selectedTask]);

  // Setup WebSocket connection
  useEffect(() => {
    if (!projectId) return;

    console.log('🔌 Setting up WebSocket for project:', projectId);

    // Connect to WebSocket
    const socket = socketService.connect();
    
    socket.on('connect', () => {
      console.log('✅ WebSocket connected, socket ID:', socket.id);
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
      setConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('🔴 WebSocket connection error:', error);
    });

    // Join project room
    socketService.joinProject(projectId);

    // Subscribe to events
    console.log('👂 Subscribing to socket events...');
    socketService.onTaskCreated(handleTaskCreated);
    socketService.onTaskUpdated(handleTaskUpdated);
    socketService.onTaskDeleted(handleTaskDeleted);

    // Fetch initial data
    fetchKanban();

    // Cleanup
    return () => {
      console.log('🧹 Cleaning up socket listeners');
      socketService.offTaskCreated(handleTaskCreated);
      socketService.offTaskUpdated(handleTaskUpdated);
      socketService.offTaskDeleted(handleTaskDeleted);
      socketService.leaveProject(projectId);
    };
  }, [projectId, fetchKanban, handleTaskCreated, handleTaskUpdated, handleTaskDeleted]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('Creating task:', formData);
      await tasksAPI.create({
        ...formData,
        projectId: parseInt(projectId!),
      });
      setShowCreateModal(false);
      setFormData({ title: '', description: '', priority: 'medium' });
      // WebSocket will handle the update
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleStatusChange = async (taskId: number, newStatus: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening task detail modal
    try {
      console.log(`🔄 Updating task ${taskId} status to ${newStatus}`);
      await tasksAPI.update(taskId, { status: newStatus as any });
      // WebSocket will handle the update
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const TaskCard: React.FC<{ task: Task }> = ({ task }) => (
    <div 
      onClick={() => setSelectedTask(task)}
      className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md hover:border-primary-300 transition-all cursor-pointer"
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-gray-900">{task.title}</h4>
        <span className="text-xs text-gray-400">#{task.id}</span>
      </div>
      
      {task.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
      )}
      
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs px-2 py-1 rounded border ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </span>
        
        {task.assignee && (
          <span className="text-xs text-gray-500">{task.assignee.name}</span>
        )}
      </div>

      {/* Quick status change buttons */}
      <div className="flex gap-2 text-xs">
        {task.status !== 'TODO' && (
          <button
            onClick={(e) => handleStatusChange(task.id, 'TODO', e)}
            className="text-blue-600 hover:text-blue-800 hover:underline"
          >
            ← TODO
          </button>
        )}
        {task.status !== 'IN_PROGRESS' && (
          <button
            onClick={(e) => handleStatusChange(task.id, 'IN_PROGRESS', e)}
            className="text-purple-600 hover:text-purple-800 hover:underline"
          >
            → Progress
          </button>
        )}
        {task.status !== 'DONE' && (
          <button
            onClick={(e) => handleStatusChange(task.id, 'DONE', e)}
            className="text-green-600 hover:text-green-800 hover:underline"
          >
            ✓ Done
          </button>
        )}
      </div>
    </div>
  );

  const Column: React.FC<{ title: string; tasks: Task[]; color: string }> = ({ title, tasks, color }) => (
    <div className="flex-1 min-w-[300px]">
      <div className={`${color} text-white px-4 py-3 rounded-t-lg flex items-center justify-between`}>
        <h3 className="font-semibold">{title}</h3>
        <span className="bg-white bg-opacity-30 px-2 py-1 rounded text-sm">
          {tasks.length}
        </span>
      </div>
      <div className="bg-gray-50 p-4 rounded-b-lg min-h-[500px] space-y-3">
        {tasks.length === 0 ? (
          <p className="text-center text-gray-400 text-sm mt-8">No tasks</p>
        ) : (
          tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))
        )}
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">Kanban Board</h1>
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
            <p className="mt-2 text-gray-600">Real-time collaborative task management.</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Task
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading tasks...</div>
        ) : (
          <div className="flex gap-6 overflow-x-auto pb-4">
            <Column title="TODO" tasks={board.TODO} color="bg-blue-500" />
            <Column title="IN PROGRESS" tasks={board.IN_PROGRESS} color="bg-purple-500" />
            <Column title="DONE" tasks={board.DONE} color="bg-green-500" />
          </div>
        )}

        {/* Create Task Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Create New Task</h2>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Task Title
                  </label>
                  <input
                    type="text"
                    required
                    className="input"
                    placeholder="Design landing page"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="Create mockups for the new landing page"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    className="input"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
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
                    Create Task
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Task Detail Modal with Comments */}
        {selectedTask && (
          <TaskDetailModal
            task={selectedTask}
            onClose={() => setSelectedTask(null)}
          />
        )}
      </div>
    </Layout>
  );
};