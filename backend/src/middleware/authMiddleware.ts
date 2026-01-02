import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Verify token
    const decoded = verifyToken(token);

    // Attach user info to request
    (req as any).user = decoded;

    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};