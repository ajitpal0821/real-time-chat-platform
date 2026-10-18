const express = require("express");

const router = express.Router({ mergeParams: true });

const messageController =
    require("../controllers/message.controller");

const authenticate =
    require("../middleware/auth.middleware");

const {
    requireRoomMember
} = require("../middleware/room.middleware");

const validate = require("../middleware/validate.middleware");
const { sendMessageSchema, updateMessageSchema } = require("../validations/message.validation");
const { roomIdParamSchema, messageParamsSchema, paginationQuerySchema } = require("../validations/common.validation");

router.post("/", authenticate, validate({ params: roomIdParamSchema, body: sendMessageSchema }), requireRoomMember, messageController.sendMessage);
router.get("/", authenticate, validate({ params: roomIdParamSchema, query: paginationQuerySchema }), requireRoomMember, messageController.getMessages);
router.patch("/:messageId", authenticate, validate({ params: messageParamsSchema, body: updateMessageSchema }), requireRoomMember, messageController.updateMessage);

router.delete(
    "/:messageId",
    authenticate,
    validate({ params: messageParamsSchema }),
    requireRoomMember,
    messageController.deleteMessage
);


module.exports = router;