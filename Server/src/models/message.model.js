const mongoose = require("mongoose");
const { required, maxLength } = require("zod/mini");

const messageSchema = new mongoose.Schema(
    {

        roomId: {
            type: mongoose.Schema.Types.ObjectId,
            reg: "Room",
            required: true,
            index: true
        },
        senderId: {
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            required:true,
            index:true
        },
        content: {
            type:String,
            required:true,
            trim:true,
            maxLength:5000
        },
        messageType: {
            type:String,
            enum:["text"],
            default:"text"
        },

    },
    {
        timestamps: true
    }

)
messageSchema.index({
    roomId:1,
    createdAt:-1
})

module.exports=mongoose.model("Message",messageSchema) 