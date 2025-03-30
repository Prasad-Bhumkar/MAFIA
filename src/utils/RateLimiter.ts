class RateLimiter {
    private requests: number;
    private limit: number;
    private timeWindow: number; // in milliseconds
    private timestamps: number[];

    constructor(limit: number, timeWindow: number) {
        this.requests = 0;
        this.limit = limit;
        this.timeWindow = timeWindow;
        this.timestamps = [];
    }

    public isRateLimited(): boolean {
        const now = Date.now();
        this.timestamps = this.timestamps.filter(timestamp => now - timestamp < this.timeWindow);

        if (this.timestamps.length < this.limit) {
            this.timestamps.push(now);
            return false; // Not rate limited
        }

        return true; // Rate limit reached
    }
}

export default RateLimiter;