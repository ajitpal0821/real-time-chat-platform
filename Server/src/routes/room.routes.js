const express = require('express');
const router = express.Router();
const authenticate = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const roomController = require("../controllers/room.controller");
const { createRoomSchema } = require("../validations/room.validation");
const { roomIdParamSchema } = require("../validations/common.validation")


router.post("/", authenticate, validate(createRoomSchema), roomController.createRoom);
router.get("/", authenticate, roomController.getMyRooms);

router.get("/:roomId", authenticate, validate({ params: roomIdParamSchema }), roomController.getRoom)

router.post("/:roomId/join", authenticate, validate({ params: roomIdParamSchema }), roomController.joinRoom);
router.post("/:roomId/leave", authenticate, validate({ params: roomIdParamSchema }), roomController.leaveRoom);


router.get(
    "/:roomId/members",
    authenticate,
    roomController.getMembers
);

// update and delete room is pending
module.exports = router;