import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const blockedChars = /[;&|$\>\<]/g;
const MAX_REQUESTS_PER_MINUTE = 100;
const requestCounts = new Map<string, number>();

export function setupSecurity(): void {
    console.log('Security module initialized');
}

export function sanitizeInput(input: string): string {
    return input.replace(blockedChars, '');
}

export function validateCommand(cmd: string): string {
    const sanitized = sanitizeInput(cmd);
    if (sanitized.length < 3) {
        throw new Error('Command must be at least 3 characters');
    }
    return sanitized;
}

export function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
    const ip = req.ip || 'unknown';
    const currentCount = requestCounts.get(ip) || 0;
    requestCounts.set(ip, currentCount + 1);

    if (currentCount + 1 > MAX_REQUESTS_PER_MINUTE) {
        return res.status(429).send('Too many requests');
    }
    next();
}

import { AuthenticatedRequest } from './types';

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader || typeof authHeader !== 'string') {
        return res.sendStatus(401);
    }

    const tokenParts = authHeader.split(' ');
    if (tokenParts.length !== 2) {
        return res.sendStatus(401);
    }

    const token = tokenParts[1];
    if (!token) {
        return res.sendStatus(401);
    }

    jwt.verify(token, process.env.JWT_SECRET as string, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}
