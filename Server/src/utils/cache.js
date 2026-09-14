const { redisClient } = require("../config/redis.js");

const setCache = async (key, value, expirationInSeconds) => {
    try {
        if (!redisClient.isReady) return;
        await redisClient.set(key, JSON.stringify(value), {
            EX: expirationInSeconds
        });
    }
    catch (error) {
        console.error("Error setting cache:", error);
    }
}

const getCache = async (key) => {
    try {
        if (!redisClient.isReady) return null;
        const value = await redisClient.get(key);
        if (!value) {
            return null;
        }
        return JSON.parse(value);
    } catch (error) {
        console.error("Error getting cache:", error);
    }
}

const deleteCache=async(key)=>{
    try {
        if (!redisClient.isReady) return;
        await redisClient.del(key);
    } catch (error) {
        console.error("Error deleting cache:", error.message);
    }
}

module.exports={setCache,getCache,deleteCache};