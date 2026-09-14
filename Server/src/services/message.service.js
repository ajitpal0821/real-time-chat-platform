const messageRepository =
    require("../repositories/message.respository");
const roomMemberRepository =
    require("../repositories/roomMember.repository");

const roomRepository =
    require("../repositories/room.repository");

const AppError =
    require("../utils/AppError");


const sendMessage = async (roomId, userId, data) => {

    const room = await roomRepository.findById(
        roomId
    );

    if (!room) {
        throw new AppError("Room not found", 404, "Room_NOT_FOUND");
    }

      const member =
        await roomMemberRepository.findMember(
            roomId,
            userId
        );

    if (!member) {
        throw new AppError(
            "You are not a member of this room",
            403,
            "ROOM_ACCESS_DENIED"
        );
    }

    const message = await messageRepository.create({
        roomId,
        senderId: userId,
        content: data.content,
        messageType: data.messageType || 'text'
    })

    return messageRepository.findById(message._id);
}

const getMessages = async (roomId, limit, before) => {

    const room = await roomRepository.findById(roomId);

    if (!room) {
        throw new AppError("Room not found", 404, "ROOM_NOT_FOUND");
    }

    const safeLimit = Math.min(Number(limit) || 50, 100);

    return messageRepository.findByRoom(
        roomId, safeLimit, before
    )
}
const updateMessage = async (roomId, messageId, userId, data) => {

    const message = await messageRepository.findById(messageId);
    if (!message) {
        throw new AppError(
            "Message not found",
            404,
            "MESSAGE_NOT_FOUND"
        );
    }

    if (message.roomId.toString() != roomId.toString()) {
        throw new AppError(
            "Message does not belong to this room",
            400,
            "MESSAGE_ROOM_MISMATCH"
        );

    }

    if (
        message.senderId._id.toString() !==
        userId.toString()
    ) {
        throw new AppError(
            "You can only edit your own messages",
            403,
            "MESSAGE_EDIT_FORBIDDEN"
        );
    }

    return messageRepository.update(messageId, {
        content: data.content
    });

}

const deleteMessage = async (
    roomId,
    messageId,
    userId
) => {

    const message =
        await messageRepository.findById(
            messageId
        );

    if (!message) {
        throw new AppError(
            "Message not found",
            404,
            "MESSAGE_NOT_FOUND"
        );
    }

    if (
        message.roomId.toString() !==
        roomId.toString()
    ) {
        throw new AppError(
            "Message does not belong to this room",
            400,
            "MESSAGE_ROOM_MISMATCH"
        );
    }

    if (
        message.senderId._id.toString() !==
        userId.toString()
    ) {
        throw new AppError(
            "You can only delete your own messages",
            403,
            "MESSAGE_DELETE_FORBIDDEN"
        );
    }

    await messageRepository.remove(
        messageId
    );
};


module.exports = {
    sendMessage,
    getMessages,
    updateMessage,
    deleteMessage
};
