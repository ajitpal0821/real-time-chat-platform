const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const { redisClient } = require("../config/redis");
const registerSocketAuth = require("./socket.auth.js");
const registerChatSocket = require("./chat.socket.js");
const { userConnected, userDisconnected, refreshuserPresence, isUserOnline } = require("../services/presence.service.js");

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




        // broadcase to all other scokets that this user is online

        socket.broadcast.emit("user_status_changed", {
            userId,
            status: "online"
        })

        // get current list of online users
        socket.on("get_online_users", async (data, callback) => {
            const ack = typeof data === "function" ? data : callback;
            try {
                const onlineSockets = await io.fetchSockets();
                const onlineUserIds = [...new Set(onlineSockets.map(s => s.data?.userId || s.user?.userId).filter(Boolean))];
                if (typeof ack === "function") {
                    ack({ success: true, onlineUserIds });
                }
            } catch (error) {
                if (typeof ack === "function") {
                    ack({ success: false, onlineUserIds: [] });
                }
            }
        });

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

            const isStillOnline = await isUserOnline(userId);

            if (!isStillOnline) {
                io.emit("user_status_changed", {
                    userId,
                    status: "offline"
                })
            }

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