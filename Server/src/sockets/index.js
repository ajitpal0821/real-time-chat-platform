const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const { redisClient } = require("../config/redis");
const registerSocketAuth = require("./socket.auth.js");
const registerChatSocket = require("./chat.socket.js");
const { userConnected, userDisconnected, refreshuserPresence } = require("../services/presence.service.js");

let io;

const initSocket = async (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || '',
            credentials: true
        }
    });

    const pubClient = redisClient.duplicate();
    const subClient = redisClient.duplicate();

    if (redisClient.isReady) {

        try {
            pubClient.on(
                "error",
                (error) => {
                    console.error(
                        "Redis Pub Client Error:",
                        error
                    );
                }
            );

            subClient.on(
                "error",
                (error) => {
                    console.error(
                        "Redis Sub Client Error:",
                        error
                    );
                }
            );
            await Promise.all([
                pubClient.connect(),
                subClient.connect()
            ]);

            io.adapter(
                createAdapter(
                    pubClient,
                    subClient
                )
            );

            console.log(
                "Socket.IO Redis adapter connected"
            );
        }
        catch (error) {
            console.error(
                "Redis adapter unavailable. Running Socket.IO without Redis:",
                error.message
            );

        }

    }
    else {
        console.log(
            "Redis unavailable. Socket.IO running without Redis adapter."
        );
    }
    io.use(registerSocketAuth);

    io.on("connection", async (socket) => {
        console.log("Socket connected:", socket.id);
        const { userId } = socket.user;
        await userConnected(userId, socket.id);

        const presenceInterval = setInterval(async () => {
            try {
                await refreshuserPresence(userId);
            } catch (error) {
                console.error(
                    "Error refreshing user presence:",
                    error.message
                );
            }
        }, 30000); // 30 seconds

        registerChatSocket(io, socket);

        socket.on("disconnect", async () => {
            clearInterval(presenceInterval);
            await userDisconnected(userId, socket.id);
            console.log("Socket disconnected:", socket.id);
        })
    })

    return io;
}
const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized. Call initSocket first.");
    }
    return io;
}
module.exports = { initSocket, getIO };