import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
    user?: any;
    headers: {
        authorization?: string;
        [key: string]: any;
    }
}
