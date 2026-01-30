import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateTaskSuggestions } from '../services/aiService';

const prisma = new PrismaClient();

export const suggestTasks = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = (req as any).user.userId;

    console.log(`🤖 AI suggestion request for project ${projectId} by user ${userId}`);

    // Get project
    const project = await prisma.project.findUnique({
      where: { id: parseInt(projectId) },
      include: {
        tasks: {
          select: { title: true },
          orderBy: { createdAt: 'desc' },
          take: 10, // Last 10 tasks for context
        },
        team: {
          include: {
            members: {
              where: { userId: userId },
            },
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check access
    if (project.team.members.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const existingTasks = project.tasks.map(t => t.title);
    console.log('📋 Existing tasks:', existingTasks);

    const suggestions = await generateTaskSuggestions(project.name, existingTasks);
    console.log('✅ Generated suggestions:', suggestions);

    res.json({ suggestions });
  } catch (error) {
    console.error('❌ AI suggestion error:', error);
    res.status(500).json({ 
      error: 'Failed to generate suggestions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};