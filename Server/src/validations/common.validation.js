const { z } = require("zod");

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, {
    message: "Invalid Id:Must be 24 hex characters"
});

const roomIdParamSchema = z.object({
    roomId: objectIdSchema
}).strict();


const messageParamsSchema = z.object({
    roomId: objectIdSchema,
    messageId: objectIdSchema
}).strict();

const paginationQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(50).optional(),
    before: z.string().datetime({ message: "Invalid before cursor:must be an ISO dateTime string" }).optional()
}).strict()

module.exports = { objectIdSchema, messageParamsSchema, roomIdParamSchema, paginationQuerySchema };