const authService = require('../services/auth.service');
const { sendSuccessResponse } = require('../utils/response');

const register = async (req, res, next) => {
    try {
        const user = await authService.register(req.body);

        return sendSuccessResponse(res, user, 201, "User registered successfully");

    }
    catch (error) {
        next(error);
    }
}

const login = async (req, res, next) => {
    try {
        const user = await authService.login(req.body);

        return sendSuccessResponse(res, user, 200, "Login successfull");

    }
    catch (error) {
        next(error);
    }
}

const refreshToken = async (req, res, next) => {
    try {
        const result = authService.refreshAccessToken(req.body.refreshToken);
        return sendSuccessResponse(res, result, 200, "Token Refreshed");
    }
    catch (error) {
        next(error);
    }
}
module.exports = { register, login, refreshToken }
