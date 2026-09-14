const {z}=require('zod');

const createRoomSchema=z.object({
    name:z.string().trim().min(2).max(100),
    description:z.string().trim().max(500).optional(),
    isPrivate:z.boolean().optional()
})

const updateRoomSchema=z.object({
    name:z.string().trim().min(2).max(100).optional(),
    description:z.string().trim().max(500).optional()
})

module.exports={createRoomSchema,updateRoomSchema}