const { redisClient } = require('../config/redis.js');


const PRESENCE_TTL = 60;
const getPresenceKey = (userId) => `presence:${userId}`;

const userConnected = async (userId, socketId) => {

    try {
        if (!redisClient.isReady) return;
        const key = getPresenceKey(userId);
        await redisClient.sAdd(key, socketId);
        await redisClient.expire(key, PRESENCE_TTL); // Set expiration to 60 seconds
    } catch (error) {
        console.error("Error in userConnected:", error.message);
    }

}

const userDisconnected = async (userId, socketId) => {
    try {
        if (!redisClient.isReady) return;
        const key = getPresenceKey(userId);
        await redisClient.sRem(key, socketId);

        const socketCount = await redisClient.sCard(key);
        if (socketCount === 0) {
            await redisClient.del(key);
        }
    }
    catch (error) {
        console.error("Error in userDisconnected:", error.message);
    }

}

const refreshuserPresence = async (userId) => {
    try {
        if (!redisClient.isReady) return;
        const key = getPresenceKey(userId);
        const socketCount = await redisClient.sCard(key);
        if (socketCount > 0) {
            await redisClient.expire(key, PRESENCE_TTL); // Refresh expiration to 60 seconds
        }
    }
    catch (error) {
        console.error("Error in refreshuserPresence:", error.message);
    }
}

const isUserOnline = async (userId) => {
    try {
        if (!redisClient.isReady) return false;

        const key = getPresenceKey(userId);
        const socketCount = await redisClient.sCard(key);
        return socketCount > 0;
    }
    catch (error) {
        console.error("Presence check error:",
            error.message
        );
        return false;
    }

}

module.exports = {
    userConnected,
    userDisconnected,
    refreshuserPresence,
    isUserOnline
};