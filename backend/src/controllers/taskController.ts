import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper: Check if user is a member of the project's team
const canAccessProject = async (userId: number, projectId: number): Promise<boolean> => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      team: {
        include: {
          members: {
            where: { userId: userId },
          },
        },
      },
    },
  });

  return !!project && project.team.members.length > 0;
};

// Helper to emit socket events
const emitTaskEvent = (req: Request, event: string, data: any, projectId: number) => {
  const io = (req.app as any).get('io');
  if (io) {
    io.to(`project-${projectId}`).emit(event, data);
    console.log(`🔔 Emitted ${event} to project-${projectId}`);
  }
};

// Create task
export const createTask = async (req: Request, res: Response) => {
  try {
    const { title, description, projectId, assigneeId, priority, dueDate } = req.body;
    const userId = (req as any).user.userId;

    // Validation
    if (!title || title.trim().length < 3) {
      return res.status(400).json({ error: 'Task title must be at least 3 characters' });
    }

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    // Check if user can access this project
    const hasAccess = await canAccessProject(userId, parseInt(projectId));
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied. You are not a member of this project\'s team' });
    }

    // If assigneeId provided, verify they're a team member
    if (assigneeId) {
      const canAssign = await canAccessProject(parseInt(assigneeId), parseInt(projectId));
      if (!canAssign) {
        return res.status(400).json({ error: 'Assignee must be a member of the project\'s team' });
      }
    }

    // Validate priority
    if (priority && !['low', 'medium', 'high'].includes(priority)) {
      return res.status(400).json({ error: 'Invalid priority. Must be: low, medium, or high' });
    }

    // Create task
    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        projectId: parseInt(projectId),
        assigneeId: assigneeId ? parseInt(assigneeId) : null,
        priority: priority || 'medium',
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            team: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // ✨ Emit socket event for real-time update
    emitTaskEvent(req, 'task-created', task, parseInt(projectId));

    res.status(201).json({
      message: 'Task created successfully',
      task,
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all tasks for a project
export const getProjectTasks = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = (req as any).user.userId;
    const { status, assigneeId, priority } = req.query;

    // Check access
    const hasAccess = await canAccessProject(userId, parseInt(projectId));
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Build filter
    const where: any = {
      projectId: parseInt(projectId),
    };

    if (status) where.status = status;
    if (assigneeId) where.assigneeId = parseInt(assigneeId as string);
    if (priority) where.priority = priority;

    // Get tasks
    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    res.json({ tasks });
  } catch (error) {
    console.error('Get project tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get single task
export const getTaskById = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const userId = (req as any).user.userId;

    const task = await prisma.task.findUnique({
      where: { id: parseInt(taskId) },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            team: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check access
    const hasAccess = await canAccessProject(userId, task.projectId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ task });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update task
export const updateTask = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { title, description, status, priority, assigneeId, dueDate } = req.body;
    const userId = (req as any).user.userId;

    // Get task
    const task = await prisma.task.findUnique({
      where: { id: parseInt(taskId) },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check access
    const hasAccess = await canAccessProject(userId, task.projectId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Validate status
    if (status && !['TODO', 'IN_PROGRESS', 'DONE'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be: TODO, IN_PROGRESS, or DONE' });
    }

    // Validate priority
    if (priority && !['low', 'medium', 'high'].includes(priority)) {
      return res.status(400).json({ error: 'Invalid priority. Must be: low, medium, or high' });
    }

    // If assigneeId provided, verify they're a team member
    if (assigneeId !== undefined) {
      if (assigneeId !== null) {
        const canAssign = await canAccessProject(parseInt(assigneeId), task.projectId);
        if (!canAssign) {
          return res.status(400).json({ error: 'Assignee must be a member of the project\'s team' });
        }
      }
    }

    // Update task
    const updatedTask = await prisma.task.update({
      where: { id: parseInt(taskId) },
      data: {
        ...(title && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(assigneeId !== undefined && { assigneeId: assigneeId ? parseInt(assigneeId) : null }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            team: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // ✨ Emit socket event for real-time update
    emitTaskEvent(req, 'task-updated', updatedTask, task.projectId);

    res.json({
      message: 'Task updated successfully',
      task: updatedTask,
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete task
export const deleteTask = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const userId = (req as any).user.userId;

    // Get task
    const task = await prisma.task.findUnique({
      where: { id: parseInt(taskId) },
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

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if user is admin
    const membership = task.project.team.members[0];
    if (!membership || membership.role !== 'admin') {
      return res.status(403).json({ error: 'Only team admins can delete tasks' });
    }

    const projectId = task.projectId;

    // Delete task
    await prisma.task.delete({
      where: { id: parseInt(taskId) },
    });

    // ✨ Emit socket event for real-time update
    emitTaskEvent(req, 'task-deleted', { id: parseInt(taskId) }, projectId);

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get tasks by status (Kanban board)
export const getTasksByStatus = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = (req as any).user.userId;

    // Check access
    const hasAccess = await canAccessProject(userId, parseInt(projectId));
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get tasks grouped by status
    const tasks = await prisma.task.findMany({
      where: {
        projectId: parseInt(projectId),
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Group by status
    const kanbanBoard = {
      TODO: tasks.filter(task => task.status === 'TODO'),
      IN_PROGRESS: tasks.filter(task => task.status === 'IN_PROGRESS'),
      DONE: tasks.filter(task => task.status === 'DONE'),
    };

    res.json({ kanbanBoard });
  } catch (error) {
    console.error('Get tasks by status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};