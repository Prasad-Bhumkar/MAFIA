"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class RateLimiter {
    constructor(limit, timeWindow) {
        this.requests = 0;
        this.limit = limit;
        this.timeWindow = timeWindow;
        this.timestamps = [];
    }
    isRateLimited() {
        const now = Date.now();
        this.timestamps = this.timestamps.filter(timestamp => now - timestamp < this.timeWindow);
        if (this.timestamps.length < this.limit) {
            this.timestamps.push(now);
            return false; // Not rate limited
        }
        return true; // Rate limit reached
    }
}
exports.default = RateLimiter;
//# sourceMappingURL=RateLimiter.js.map