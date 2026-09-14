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
        return next(
            new AppError(
                "Invalid or expired token",
                401,
                "INVALID_TOKEN"
            )
        );
    }
};
module.exports=authenticate