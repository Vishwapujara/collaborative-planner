import express from 'express';
import {
  createProject,
  getTeamProjects,
  getProjectById,
  updateProject,
  deleteProject,
} from '../controllers/projectController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

// All project routes require authentication
router.use(authenticateToken);

// Create project
router.post('/', createProject);

// Get all projects for a team
router.get('/team/:teamId', getTeamProjects);

// Get single project
router.get('/:projectId', getProjectById);

// Update project
router.put('/:projectId', updateProject);

// Delete project (admin only)
router.delete('/:projectId', deleteProject);

export default router;