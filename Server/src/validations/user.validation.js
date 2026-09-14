const {z}=require('zod');

const createUserSchema=z.object({

    name:z.string().trim().min(3,{message:"Name must be at least 3 characters long"}).max(20,{message:"Name must be less than 20 characters long"}),

    email:z.string().trim().email({message:"Invalid email address"}),
})

module.exports={createUserSchema}
