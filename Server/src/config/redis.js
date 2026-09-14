const { createClient } = require("redis");


const redisClient = createClient({
    url: process.env.REDIS_URL,
    socket: {
        reconnectStrategy: false,
        connectTimeout: 1000
    }
});


redisClient.on("error",(err)=>{
    console.error("Redis unavailable:", err.message);
});

const connectRedis=async()=>{
    if(!redisClient.isOpen){
        await redisClient.connect();
        console.log("Redis Connnected");
    }
}

module.exports = { redisClient, connectRedis };