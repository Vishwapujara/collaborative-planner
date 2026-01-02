import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create new team
export const createTeam = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    const userId = (req as any).user.userId;

    // Validation
    if (!name || name.trim().length < 3) {
      return res.status(400).json({ error: 'Team name must be at least 3 characters' });
    }

    // Create team and add creator as admin
    const team = await prisma.team.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        creatorId: userId,
        members: {
          create: {
            userId: userId,
            role: 'admin',
          },
        },
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json({
      message: 'Team created successfully',
      team,
    });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all teams for current user
export const getUserTeams = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const teams = await prisma.team.findMany({
      where: {
        members: {
          some: {
            userId: userId,
          },
        },
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ teams });
  } catch (error) {
    console.error('Get user teams error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get single team by ID
export const getTeamById = async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;
    const userId = (req as any).user.userId;

    const team = await prisma.team.findFirst({
      where: {
        id: parseInt(teamId),
        members: {
          some: {
            userId: userId,
          },
        },
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!team) {
      return res.status(404).json({ error: 'Team not found or access denied' });
    }

    res.json({ team });
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Add member to team
export const addTeamMember = async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;
    const { email } = req.body;
    const userId = (req as any).user.userId;

    // Check if current user is admin of the team
    const membership = await prisma.teamMember.findFirst({
      where: {
        teamId: parseInt(teamId),
        userId: userId,
        role: 'admin',
      },
    });

    if (!membership) {
      return res.status(403).json({ error: 'Only team admins can add members' });
    }

    // Find user to add
    const userToAdd = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true },
    });

    if (!userToAdd) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already a member
    const existingMember = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: userToAdd.id,
          teamId: parseInt(teamId),
        },
      },
    });

    if (existingMember) {
      return res.status(409).json({ error: 'User is already a member of this team' });
    }

    // Add member
    const newMember = await prisma.teamMember.create({
      data: {
        userId: userToAdd.id,
        teamId: parseInt(teamId),
        role: 'member',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      message: 'Member added successfully',
      member: newMember,
    });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};