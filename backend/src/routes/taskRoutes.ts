import express from 'express';
import {
  createTask,
  getProjectTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getTasksByStatus,
} from '../controllers/taskController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

// All task routes require authentication
router.use(authenticateToken);

// Create task
router.post('/', createTask);

// Get all tasks for a project (with optional filters)
router.get('/project/:projectId', getProjectTasks);

// Get Kanban board (tasks grouped by status)
router.get('/project/:projectId/kanban', getTasksByStatus);

// Get single task
router.get('/:taskId', getTaskById);

// Update task
router.put('/:taskId', updateTask);

// Delete task (admin only)
router.delete('/:taskId', deleteTask);

export default router;