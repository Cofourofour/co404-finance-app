import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/constants';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user: {
        id: number;
        username: string;
        role: string;
        location: string;
      };
    }
  }
}

export interface JWTPayload {
  id: number;
  username: string;
  role: string;
  location: string;
  iat?: number;
  exp?: number;
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.sendStatus(401);
    return;
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      res.sendStatus(403);
      return;
    }
    
    const user = decoded as JWTPayload;
    req.user = {
      id: user.id,
      username: user.username,
      role: user.role,
      location: user.location
    };
    
    next();
  });
};