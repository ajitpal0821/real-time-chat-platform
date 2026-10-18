const { z } = require('zod');

const createRoomSchema = z.object({
    name: z.string().trim().min(2).max(100),
    description: z.string().trim().max(500).optional(),
    isPrivate: z.boolean().optional()
}).strict()

const updateRoomSchema = z.object({
    name: z.string().trim().min(2).max(100).optional(),
    description: z.string().trim().max(500).optional()
}).strict()

module.exports = { createRoomSchema, updateRoomSchema }