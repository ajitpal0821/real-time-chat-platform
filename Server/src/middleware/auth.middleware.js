const { verifyAccessToken } = require('../utils/jwt');
const AppError = require('../utils/AppError');


const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next(
            new AppError(
                "Authentication required",
                401,
                "UNAUTHORIZED"
            )
        );
    }

    const token = authHeader.split(" ")[1];

    try {
        const payload = verifyAccessToken(token);
        req.user = payload;
        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return next(new AppError("Token Expired!", 401, "TOKEN_EXPIRED"))
        }
        else {
            return next(
                new AppError("Invalid access toekn", 401, "INVALID_TOKEN")
            )
        }
    }
};
module.exports = authenticate