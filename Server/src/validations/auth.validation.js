const {z}=require('zod');

const registerSchema=z.object({
    name:z.string().trim().min(3,{message:"Name must be at least 3 characters long "}).max(20,{message:"Name must be less than 20 characters long"}),
    email:z.string().email().toLowerCase(),
    password:z.string().trim().min(6,{message:"Password must be at least 6 characters long"}).max(20,{message:"Password must be less than 20 characters long"}),
})
const loginSchema=z.object({
    email:z.string().trim().email().toLowerCase(),
    password:z.string().trim().min(6,{message:"Password must be at least 6 characters long"}).max(20,{message:"Password must be less than 20 characters long"}),
})

module.exports={ registerSchema,loginSchema}