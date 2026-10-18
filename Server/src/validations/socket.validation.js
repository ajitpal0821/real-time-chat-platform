const { z } = require("zod");
const { objectIdSchema } = require("./common.validation");


const joinLeaveRoomSchema = z.object({
    roomId: objectIdSchema
}).strict();

const sendMessageSocketSchema = z.object({
    roomId: objectIdSchema,
    content: z.string().trim().min(1, { message: "Message cannot be empty" }).max(5000, { message: "Message cannot exceed 5000 characters" }),
    messageType: z.enum(["text"]).optional().default("text")
}).strict();

const updateMessageSocketSchema = z.object({
    roomId: objectIdSchema,
    messageId: objectIdSchema,
    content: z.string().trim().min(1, { message: "Message cannot be empty" }).max(5000, { message: "Message cannot exceed 5000 characters" })
}).strict();

const typingSocketSchema = z.object({
    roomId: objectIdSchema
}).strict();

const deleteMessageSocketSchema = z.object({
    roomId: objectIdSchema,
    messageId: objectIdSchema
}).strict();

module.exports = { joinLeaveRoomSchema, sendMessageSocketSchema, updateMessageSocketSchema, deleteMessageSocketSchema, typingSocketSchema };
