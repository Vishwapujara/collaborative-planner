import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/authMiddleware';
import { generateTaskSuggestions, generateProjectInsights } from '../services/aiService';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

// Suggest tasks for a project
router.get('/suggest/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await prisma.project.findUnique({
      where: { id: parseInt(projectId) },
      include: {
        tasks: { select: { title: true } },
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const suggestions = await generateTaskSuggestions(
      project.name,
      project.tasks.map(t => t.title)
    );

    res.json({ suggestions });
  } catch (error) {
    console.error('Suggestion error:', error);
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
});

// Get project insights
router.get('/insights/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await prisma.project.findUnique({
      where: { id: parseInt(projectId) },
      include: {
        tasks: {
          select: { title: true, status: true, priority: true },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const insights = await generateProjectInsights(project.name, project.tasks);

    res.json({ insights });
  } catch (error) {
    console.error('Insights error:', error);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

export default router;