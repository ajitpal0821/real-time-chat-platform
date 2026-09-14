const roomMemberRepository = require('../repositories/roomMember.repository');
const AppError = require('../utils/AppError');



const requireRoomMember = async (req, res, next) => {
    try {
        const { roomId } = req.params;
        const userId = req.user.userId;

        if (!roomId || !userId) {
            throw new AppError(
                "Room ID and User ID are required", 400, "INVALID_INPUT"
            );
        }
        const member = await roomMemberRepository.findMember(roomId, userId);

        if (!member) {
            throw new AppError(
                "You do not have access to this room",
                403,
                "ROOM_ACCESS_DENIED"
            );
        }

        req.roomMember = member;
        next();
    }
    catch (err) {
        next(err);
    }
}

module.exports = { requireRoomMember }