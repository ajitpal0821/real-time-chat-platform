const Message = require("../models/message.model");


const create = async (data) => {
    return Message.create(data);
}
const findById = async (messageId) => {
    return Message.findById(messageId).populate("senderId", "name email avatar");
}


const findByRoom = async (roomId, limit = 50, before) => {
    const query = {
        roomId
    };

    if (before) {
        query.createdAt = {
            $lt: before
        }
    }

    return Message.find(query).populate("senderId", "name email avatar").sort({ createdAt: -1 }).limit(limit);
}

const update = async (messageId, data) => {
    return Message.findOneAndUpdate({ _id: messageId }, data, {
        new: true, runValidators: true
    }).populate("senderId", "name email avatar");
};

const remove = async (messageId) => {
    return Message.findByIdAndDelete(messageId);
};
module.exports = {
    create,
    findById,
    findByRoom,
    update,
    remove
};