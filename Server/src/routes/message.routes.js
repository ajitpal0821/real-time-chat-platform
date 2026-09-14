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

router.post("/", authenticate, requireRoomMember,validate(sendMessageSchema), messageController.sendMessage);
router.get("/", authenticate, requireRoomMember, messageController.getMessages);
router.patch("/:messageId", authenticate, requireRoomMember, validate(updateMessageSchema),messageController.updateMessage);

router.delete(
    "/:messageId",
    authenticate,
    requireRoomMember,
    messageController.deleteMessage
);


module.exports = router;