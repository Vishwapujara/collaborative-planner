import express from 'express';
import {
  createTeam,
  getUserTeams,
  getTeamById,
  addTeamMember,
} from '../controllers/teamController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

// All team routes require authentication
router.use(authenticateToken);

router.post('/', createTeam);
router.get('/', getUserTeams);
router.get('/:teamId', getTeamById);
router.post('/:teamId/members', addTeamMember);

export default router;