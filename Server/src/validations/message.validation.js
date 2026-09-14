const { z } = require("zod");

const sendMessageSchema = z.object({

    content: z.string().trim().min(1, "Message cannot be empty").max(5000),
    messageType: z.enum(["text"]).optional()
});

const updateMessageSchema = z.object({

    content: z.string().trim().min(1, "Message cannot be empty").max(5000)
});

module.exports = {
    sendMessageSchema, updateMessageSchema
}
