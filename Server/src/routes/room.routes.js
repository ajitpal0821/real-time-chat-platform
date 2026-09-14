const express = require('express');

const router = express.Router();

const authenticate = require("../middleware/auth.middleware");


const validate = require("../middleware/validate.middleware");
const roomController = require("../controllers/room.controller");
const { createRoomSchema } = require("../validations/room.validation");


router.post("/", authenticate, validate(createRoomSchema), roomController.createRoom);
router.get("/:roomId", authenticate, roomController.getRoom);
router.get("/", authenticate, roomController.getMyRooms);


router.post("/:roomId/join", authenticate, roomController.joinRoom);
router.post("/:roomId/leave", authenticate, roomController.leaveRoom);


router.get(
    "/:roomId/members",
    authenticate,
    roomController.getMembers
);

// update and delete room is pending
module.exports = router;