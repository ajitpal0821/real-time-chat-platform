const mongoose = require("mongoose");
const { minLength, maxLength } = require("zod");
const { required } = require("zod/mini");

const roomSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        trim: true,
        minLength: 2,
        maxLength: 20
    },
    description: {
        type: String,
        trim: true,
        maxLength: 500

    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    isPrivate: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
})

module.exports=mongoose.model("Room",roomSchema)