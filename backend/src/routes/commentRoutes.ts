import express from 'express';
import {
  createComment,
  getTaskComments,
  deleteComment,
} from '../controllers/commentController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

// All comment routes require authentication
router.use(authenticateToken);

// Create comment
router.post('/', createComment);

// Get all comments for a task
router.get('/task/:taskId', getTaskComments);

// Delete comment
router.delete('/:commentId', deleteComment);

export default router;