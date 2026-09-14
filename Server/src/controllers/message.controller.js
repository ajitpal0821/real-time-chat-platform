const messageService =
    require("../services/message.service");

const {
    sendSuccessResponse
} = require("../utils/response");


const sendMessage = async (
    req,
    res,
    next
) => {

    try {

        const message =
            await messageService.sendMessage(
                req.params.roomId,
                req.user.userId,
                req.body
            );

        return sendSuccessResponse(
            res,
            message,
            201,
            "Message sent successfully"
        );

    } catch (error) {
        next(error);
    }
};


const getMessages = async (
    req,
    res,
    next
) => {

    try {

        const messages =
            await messageService.getMessages(
                req.params.roomId,
                req.query.limit,
                req.query.before
            );

        return sendSuccessResponse(
            res,
            messages
        );

    } catch (error) {
        next(error);
    }
};


const updateMessage = async (
    req,
    res,
    next
) => {

    try {

        const message =
            await messageService.updateMessage(
                req.params.roomId,
                req.params.messageId,
                req.user.userId,
                req.body
            );

        return sendSuccessResponse(
            res,
            message,
            200,
            "Message updated successfully"
        );

    } catch (error) {
        next(error);
    }
};


const deleteMessage = async (
    req,
    res,
    next
) => {

    try {

        await messageService.deleteMessage(
            req.params.roomId,
            req.params.messageId,
            req.user.userId
        );

        return sendSuccessResponse(
            res,
            null,
            200,
            "Message deleted successfully"
        );

    } catch (error) {
        next(error);
    }
};


module.exports = {
    sendMessage,
    getMessages,
    updateMessage,
    deleteMessage
};