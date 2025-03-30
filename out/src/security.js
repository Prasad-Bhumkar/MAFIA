"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSecurity = setupSecurity;
exports.sanitizeInput = sanitizeInput;
exports.validateCommand = validateCommand;
exports.rateLimitMiddleware = rateLimitMiddleware;
exports.authenticateToken = authenticateToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const blockedChars = /[;&|$\>\<]/g;
const MAX_REQUESTS_PER_MINUTE = 100;
const requestCounts = new Map();
function setupSecurity() {
    console.log('Security module initialized');
}
function sanitizeInput(input) {
    return input.replace(blockedChars, '');
}
function validateCommand(cmd) {
    const sanitized = sanitizeInput(cmd);
    if (sanitized.length < 3) {
        throw new Error('Command must be at least 3 characters');
    }
    return sanitized;
}
function rateLimitMiddleware(req, res, next) {
    const ip = req.ip || 'unknown';
    const currentCount = requestCounts.get(ip) || 0;
    requestCounts.set(ip, currentCount + 1);
    if (currentCount + 1 > MAX_REQUESTS_PER_MINUTE) {
        return res.status(429).send('Too many requests');
    }
    next();
}
function authenticateToken(req, res, next) {
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
    jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err)
            return res.sendStatus(403);
        req.user = user;
        next();
    });
}
//# sourceMappingURL=security.js.map