import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper: Check if user can access task
const canAccessTask = async (userId: number, taskId: number): Promise<boolean> => {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: {
        include: {
          team: {
            include: {
              members: {
                where: { userId: userId },
              },
            },
          },
        },
      },
    },
  });

  return !!task && task.project.team.members.length > 0;
};

// Helper to emit socket events
const emitCommentEvent = (req: Request, event: string, data: any, taskId: number) => {
  const io = (req.app as any).get('io');
  if (io) {
    // Emit to task-specific room (we'll use project room for now)
    io.to(`task-${taskId}`).emit(event, data);
    console.log(`🔔 Emitted ${event} for task-${taskId}`);
  }
};

// Create comment
export const createComment = async (req: Request, res: Response) => {
  try {
    const { content, taskId } = req.body;
    const userId = (req as any).user.userId;

    // Validation
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    if (!taskId) {
      return res.status(400).json({ error: 'Task ID is required' });
    }

    // Check if user can access this task
    const hasAccess = await canAccessTask(userId, parseInt(taskId));
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied. You cannot comment on this task' });
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        taskId: parseInt(taskId),
        authorId: userId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // ✨ Emit socket event
    emitCommentEvent(req, 'comment-created', comment, parseInt(taskId));

    res.status(201).json({
      message: 'Comment created successfully',
      comment,
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all comments for a task
export const getTaskComments = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const userId = (req as any).user.userId;

    // Check access
    const hasAccess = await canAccessTask(userId, parseInt(taskId));
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get comments
    const comments = await prisma.comment.findMany({
      where: {
        taskId: parseInt(taskId),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc', // Oldest first (like a chat)
      },
    });

    res.json({ comments });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete comment
export const deleteComment = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const userId = (req as any).user.userId;

    // Get comment
    const comment = await prisma.comment.findUnique({
      where: { id: parseInt(commentId) },
      include: {
        task: {
          include: {
            project: {
              include: {
                team: {
                  include: {
                    members: {
                      where: { userId: userId },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Only author or team admin can delete
    const membership = comment.task.project.team.members[0];
    const isAuthor = comment.authorId === userId;
    const isAdmin = membership?.role === 'admin';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ 
        error: 'Only comment author or team admin can delete comments' 
      });
    }

    const taskId = comment.taskId;

    // Delete comment
    await prisma.comment.delete({
      where: { id: parseInt(commentId) },
    });

    // ✨ Emit socket event
    emitCommentEvent(req, 'comment-deleted', { id: parseInt(commentId) }, taskId);

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};