const roomService = require("../services/room.service");;
const { sendSuccessResponse } = require("../utils/response");

const createRoom = async (req, res, next) => {
    try {
        const room = await roomService.createRoom(req.user.userId, req.body);
        // console.log(req);
        return sendSuccessResponse(res, room, 201, "Room Created Successfully");
    }
    catch (error) {
        console.log(error);
        next(error);
    }
}

const getRoom = async (req, res, next) => {
    try {
        const data = await roomService.getRoom(req.params.roomId, req.user.userId);

        return sendSuccessResponse(res, data);
    }
    catch (error) {
        next(error);
    }
}
const getMyRooms = async (req, res, next) => {
    try {
        const data = await roomService.getMyRooms(req.user.userId);

        return sendSuccessResponse(res, data);
    }
    catch (error) {
        next(error);
    }
}
const joinRoom = async (req, res, next) => {
    try {
        const data = await roomService.joinRoom(req.params.roomId, req.user.userId);
        return sendSuccessResponse(
            res,
            data,
            201,
            "Joined room successfully"
        );
    }
    catch (error) {
        next(error);
    }
}

const leaveRoom = async (
    req,
    res,
    next
) => {
    console.log(req.params)
    try {
        await roomService.leaveRoom(
            req.params.roomId,
            req.user.userId
        );

        return sendSuccessResponse(
            res,
            null,
            200,
            "Left room successfully"
        );

    } catch (error) {
        next(error);
    }
};
const getMembers = async (
    req,
    res,
    next
) => {

    try {

        const members =
            await roomService.getMembers(
                req.params.roomId,
                req.user.userId
            );

        return sendSuccessResponse(
            res,
            members
        );

    } catch (error) {
        next(error);
    }
};

module.exports = { createRoom, getRoom, getMyRooms, joinRoom,leaveRoom,getMembers };