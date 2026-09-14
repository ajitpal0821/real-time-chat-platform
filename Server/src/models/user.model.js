const mongoose = require('mongoose');
const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        passwordHash:{
            type:String,
            required:true,
            select:false
        },

        status: {
            type: String,
            enum: ["offline", "online"],
            default: "offline"
        },
        lastSeen: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);
const User = mongoose.model("User", userSchema);
module.exports = User;