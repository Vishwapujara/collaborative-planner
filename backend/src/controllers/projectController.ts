import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper: Check if user is a member of the team
const isTeamMember = async (userId: number, teamId: number): Promise<boolean> => {
  const membership = await prisma.teamMember.findUnique({
    where: {
      userId_teamId: {
        userId: userId,
        teamId: teamId,
      },
    },
  });
  return !!membership;
};

const emitProjectEvent = (req: Request, event: string, data: any, teamId: number) => {
  const io = (req.app as any).get('io');
  if (io) {
    io.to(`team-${teamId}`).emit(event, data);
    console.log(`🔔 Emitted ${event} to team-${teamId}`);
  }
};

// Create project
export const createProject = async (req: Request, res: Response) => {
  try {
    const { name, description, teamId } = req.body;
    const userId = (req as any).user.userId;

    // Validation
    if (!name || name.trim().length < 3) {
      return res.status(400).json({ error: 'Project name must be at least 3 characters' });
    }

    if (!teamId) {
      return res.status(400).json({ error: 'Team ID is required' });
    }

    // Check if user is a member of the team
    const isMember = await isTeamMember(userId, parseInt(teamId));
    if (!isMember) {
      return res.status(403).json({ error: 'You must be a team member to create projects' });
    }

    // Create project
    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        teamId: parseInt(teamId),
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    emitProjectEvent(req, 'project-created', project, parseInt(teamId));


    res.status(201).json({
      message: 'Project created successfully',
      project,
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all projects for a team
export const getTeamProjects = async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;
    const userId = (req as any).user.userId;

    // Check if user is a member of the team
    const isMember = await isTeamMember(userId, parseInt(teamId));
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied. You are not a member of this team' });
    }

    // Get all projects for the team
    const projects = await prisma.project.findMany({
      where: {
        teamId: parseInt(teamId),
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ projects });
  } catch (error) {
    console.error('Get team projects error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get single project by ID
export const getProjectById = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = (req as any).user.userId;

    const project = await prisma.project.findUnique({
      where: {
        id: parseInt(projectId),
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if user is a member of the team
    const isMember = await isTeamMember(userId, project.teamId);
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied. You are not a member of this team' });
    }

    res.json({ project });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update project
export const updateProject = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { name, description, status } = req.body;
    const userId = (req as any).user.userId;

    // Get project to check team membership
    const project = await prisma.project.findUnique({
      where: { id: parseInt(projectId) },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if user is a member of the team
    const isMember = await isTeamMember(userId, project.teamId);
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied. You are not a member of this team' });
    }

    // ✨ NEW: If trying to change status, check if user is admin
    if (status && status !== project.status) {
      const membership = await prisma.teamMember.findUnique({
        where: {
          userId_teamId: {
            userId: userId,
            teamId: project.teamId,
          },
        },
      });

      if (!membership || membership.role !== 'admin') {
        return res.status(403).json({ 
          error: 'Only team admins can change project status' 
        });
      }
    }

    // Validate status if provided
    if (status && !['active', 'archived', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be: active, archived, or completed' });
    }

    // Update project
    const updatedProject = await prisma.project.update({
      where: { id: parseInt(projectId) },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(status && { status }),
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    emitProjectEvent(req, 'project-updated', updatedProject, project.teamId);

    res.json({
      message: 'Project updated successfully',
      project: updatedProject,
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete project
export const deleteProject = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = (req as any).user.userId;

    // Get project to check team membership
    const project = await prisma.project.findUnique({
      where: { id: parseInt(projectId) },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if user is an admin of the team
    const membership = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: userId,
          teamId: project.teamId,
        },
      },
    });

    if (!membership) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (membership.role !== 'admin') {
      return res.status(403).json({ error: 'Only team admins can delete projects' });
    }

    const teamId = project.teamId;

    // Delete project
    await prisma.project.delete({
      where: { id: parseInt(projectId) },
    });

    emitProjectEvent(req, 'project-deleted', { id: parseInt(projectId) }, teamId);


    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};