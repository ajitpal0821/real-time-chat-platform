const userService = require("../services/user.service.js")
const authService = require("../services/auth.service.js")
const { sendSuccessResponse } = require("../utils/response.js")
const createUser = async (req, res, next) => {
    try {
        const user = await userService.createUser(req.body);
        console.log("user created successfully", user)
        sendSuccessResponse(res, user, 201, "User Created Successfully");
    }
    catch (err) {
        console.error("Error creating user:", err);
        next(err)
    }
}
const getAllUsers = async (req, res, next) => {
    try {
        const users = await userService.getAllUsers(filters);
        sendSuccessResponse(res, users, 200, "Users fetched successfully");
    }
    catch (err) {
        console.error("Error fetching users:", err);
        next(err);
    }
}

const getUserById = async (req, res, next) => {

    try {
        const user = await userService.getUserById(req.params.id)
        sendSuccessResponse(res, user, 200);
    }
    catch (err) {
        console.error("Error fetching user:", err);
        next(err)
    }
}
const updateUser = async (req, res, next) => {
    try {
        const user = await userService.updateUser(req.params.id, req.body);
        sendSuccessResponse(res, user, 200, "User updated successfully");
    }
    catch (err) {
        console.error("Error updating user:", err);
        next(err);
    }
}

const getCurrentUser = async (req, res, next) => {
    try {
        const user = await userService.getUserById(req.user.userId);
        return sendSuccessResponse(res, user);
    }
    catch (error) {
        next(error);
    }
}
const refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        const userToken = authService.refreshAccessToken(refreshToken);
        return sendSuccessResponse(res, userToken, 200, "Token refreshed successfully");
    }
    catch (error) {
        next(error);
    }
}

module.exports = { createUser, getAllUsers, getUserById, updateUser, getCurrentUser, refreshToken };