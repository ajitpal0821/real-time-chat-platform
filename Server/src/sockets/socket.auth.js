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
        };
        socket.data.userId = decoded.userId;

        next();
    }
    catch (error) {
        if (error.name === "TokenExpiredError") {
            return next(new Error("TOKEN_EXPIRED"));
        }
        return next(new Error("INVALID_TOKEN"));

    }
}

module.exports = registerSocketAuth;