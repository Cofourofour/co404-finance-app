import { Request, Response, NextFunction } from 'express';
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
export declare const authenticateToken: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map