const { verifyAccessToken } = require("../utils/jwt.js");

const registerSocketAuth = (socket, next) => {
    try {
        const token = socket.handshake.auth?.token;

        if (!token) {
            return next(new Error("Authentication Error - Token not provided"));
        }

        const decoded = verifyAccessToken(token);

        socket.user = {
            userId: decoded.userId
        }

        next();
    }
    catch (error) {
        console.error("Socket authentication error:", error);
        next(new Error("Authentication Error"));
    }
}

module.exports = registerSocketAuth;