const { redisClient } = require("../config/redis.js");

const rateLimiter = ({ keyPrefix, limit, windowSeconds }) => {
    return async (req, res, next) => {
        try {
            const identifier = req.ip || req.socket.remoteAddress;

            const key = `${keyPrefix}:${identifier}`;
            const current = await redisClient.incr(key);

            if (current === 1) {
                await redisClient.expire(key, windowSeconds);
            }
            if (current > limit) {
                return res.status(429).json({ message: "Too many requests. Please try again later." });
            }
            next();
        } catch (error) {
            console.error("Redis rate limiter unavailable:", error.message);
            next();
        }
    };


}

module.exports = rateLimiter;