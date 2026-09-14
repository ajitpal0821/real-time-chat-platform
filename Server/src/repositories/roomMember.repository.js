const RoomMember = require('../models/roomMember.model');

const create = async (data) => {
    return RoomMember.create(data);
}

const findMember = async (roomId,userId) => {
    return RoomMember.findOne({roomId,userId});
}

const findByRoom = async (roomId) => {
    return RoomMember.find({
        roomId
    }).populate("userId","name email avatar status"
    )
}
const findByUser = async (userId) => {
    return RoomMember.find({
        userId
    }).populate("roomId");
};

const remove=async(roomId,userId)=>{
    return RoomMember.findOneAndDelete({roomId,userId});
}

module.exports={
    create,findMember,findByRoom,findByUser,remove
}