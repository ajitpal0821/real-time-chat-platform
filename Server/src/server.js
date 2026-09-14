require("dotenv").config();
const http = require("http");
const mongoose = require("mongoose");
const app = require('./app.js');
const { initSocket } = require('./sockets');
const { connectRedis, redisClient } = require('./config/redis.js');

const PORT = process.env.PORT || 3000;
const connectDB = require('./config/database.js');

const startServer = async () => {
    try {
        await connectRedis();
    } catch (error) {
        console.error(
            "Redis unavailable. Starting without Redis:",
            error.message
        );
    }

    const server = http.createServer(app);
    await initSocket(server);
    await connectDB();

    server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });

    const shutdown = async (signal) => {
        console.log(`Received ${signal}. Closing server...`);

        if (!server.listening) {
            process.exit(0);
        }

        server.close(async () => {
            try {
                if (redisClient && redisClient.isOpen) {
                    await redisClient.quit();
                    console.log("Redis connection closed.");
                }

                if (mongoose.connection.readyState === 1) {
                    await mongoose.connection.close();
                    console.log("MongoDB connection closed.");
                }

                console.log("Server closed gracefully.");
                process.exit(0);
            } catch (err) {
                console.error("Shutdown error:", err.message);
                process.exit(1);
            }
        });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
};

startServer();