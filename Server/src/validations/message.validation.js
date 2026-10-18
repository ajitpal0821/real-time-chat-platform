const { z } = require("zod");

const sendMessageSchema = z.object({
    content: z.string().trim().min(1, "Message cannot be empty").max(5000, 'Message cannot exceed 5000 characters'),
    messageType: z.enum(["text"]).optional()
}).strict();

const updateMessageSchema = z.object({
    content: z.string().trim().min(1, "Message cannot be empty").max(5000, 'Message cannot exceed 5000 characters').optional()
}).strict();

module.exports = {
    sendMessageSchema, updateMessageSchema
}
