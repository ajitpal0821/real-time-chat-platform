const RoomMemberRepository = require("../repositories/roomMember.repository");
const messageService = require("../services/message.service");
const {
    joinLeaveRoomSchema,
    sendMessageSocketSchema,
    updateMessageSocketSchema,
    deleteMessageSocketSchema,
    typingSocketSchema
} = require("../validations/socket.validation");
const registerChatSocket = (io, socket) => {


    socket.on("join_room", async (data, callback) => {
        try {
            const validation = joinLeaveRoomSchema.safeParse(data);
            if (!validation.success) {
                return callback?.({
                    success: false,
                    code: "VALIDATION_ERROR",
                    message: validation.error.issues[0]?.message || "Invalid room payload"
                });
            }
            const { roomId } = validation.data;
            const userId = socket.user.userId;
            const roomMember = await RoomMemberRepository.findMember(roomId, userId);

            if (!roomMember) {
                return callback?.({ success: false, code: "Room_ACCESS_DENIED", message: "User is not a member of this room" });
            }

            socket.join(roomId);
            callback?.({ success: true, message: `Joined room ${roomId}` });
            socket.to(roomId).emit("user_joined", { userId, roomId });
        } catch (error) {
            console.error("Error joining room:", error);
            callback?.({ status: "error", message: error.message });
        }
    });

    socket.on("leave_room", async (data, callback) => {
        try {
            const validation = joinLeaveRoomSchema.safeParse(data);
            if (!validation.success) {
                return callback?.({
                    success: false,
                    code: "VALIDATION_ERROR",
                    message: validation.error.issues[0]?.message || "Invalid room payload"
                });
            }
            const { roomId } = validation.data;
            socket.leave(roomId);
            callback?.({ success: true, message: `Left room ${roomId}` });
            socket.to(roomId).emit("user_left", { userId: socket.user.userId, roomId });
        }
        catch (error) {
            console.error("Error leaving room:", error);
            callback?.({ success: false, message: error.message });
        }
    })

    socket.on("send_message", async (data, callback) => {
        try {
            const validation = sendMessageSocketSchema.safeParse(data);
            if (!validation.success) {
                return callback?.({
                    success: false,
                    code: "VALIDATION_ERROR",
                    message: validation.error.issues[0]?.message || "Invalid message payload"
                });
            }
            const { roomId, content, messageType } = validation.data;
            const userId = socket.user.userId;
            const member = await RoomMemberRepository.findMember(roomId, userId);
            if (!member) {
                return callback?.({ success: false, code: "Room_ACCESS_DENIED", message: "User is not a member of this room" });
            }
            const message = await messageService.sendMessage(roomId, userId, {
                content,
                messageType
            });
            io.to(roomId).emit("new_message", message);

            callback?.({ success: true, message });
        }
        catch (error) {
            console.error("Error sending message:", error);
            callback?.({ success: false, message: error.message });
        }
    });

    socket.on("update_message", async (data, callback) => {
        try {

            const validation = updateMessageSocketSchema.safeParse(data);
            if (!validation.success) {
                return callback?.({
                    success: false,
                    code: "VALIDATION_ERROR",
                    message: validation.error.issues[0]?.message || "Invalid update payload"
                });
            }
            const { roomId, messageId, content } = validation.data;
            const userId = socket.user.userId;
            const member = await RoomMemberRepository.findMember(roomId, userId);

            if (!member) {
                return callback?.({ success: false, code: "Room_ACCESS_DENIED", message: "User is not a member of this room" });
            }

            const message = await messageService.updateMessage(roomId, messageId, userId, { content });

            io.to(roomId).emit("message_updated", message);
            callback?.({ success: true, message });
        } catch (error) {
            console.error("Error updating message:", error);
            callback?.({ success: false, message: error.message });
        }
    });

    socket.on("delete_message", async (data, callback) => {
        try {
            const validation = deleteMessageSocketSchema.safeParse(data);
            if (!validation.success) {
                return callback?.({
                    success: false,
                    code: "VALIDATION_ERROR",
                    message: validation.error.issues[0]?.message || "Invalid delete payload"
                });
            }
            const { roomId, messageId } = validation.data;
            const userId = socket.user.userId;
            const member = await RoomMemberRepository.findMember(roomId, userId);

            if (!member) {
                return callback?.({ success: false, code: "Room_ACCESS_DENIED", message: "User is not a member of this room" });
            }

            await messageService.deleteMessage(roomId, messageId, userId);

            io.to(roomId).emit("message_deleted", { roomId, messageId, deletedBy: userId });
            callback?.({ success: true, messageId });
        } catch (error) {
            console.error("Error deleting message:", error);
            callback?.({ success: false, message: error.message });
        }
    });

    socket.on("typing_start", async (data) => {
        const validation = typingSocketSchema.safeParse(data);
        if (!validation.success) return;
        const { roomId } = validation.data;
        const userId = socket.user.userId;
        const member = await RoomMemberRepository.findMember(roomId, userId);

        if (!member) {
            {
                return; // no callback
            }
        }

        socket.to(roomId).emit("user_typing", {
            userId
        })
    });

    socket.on(
        "typing_stop",
        async (data) => {
            const validation = typingSocketSchema.safeParse(data);
            if (!validation.success) return;
            const { roomId } = validation.data
            const userId = socket.user.userId;
            const member =
                await RoomMemberRepository.findMember(
                    roomId,
                    userId
                );

            if (!member) {
                return;
            }

            socket.to(roomId).emit("user_stopped_typing", {
                userId: socket.user.userId
            });
        }
    );

}

module.exports = registerChatSocket;