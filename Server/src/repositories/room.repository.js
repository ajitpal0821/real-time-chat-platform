const Room = require('../models/room.model');

const create = async (data) => {
    return Room.create(data);
}

const findById = async (roomId) => {
    return Room.findById(roomId);
}

const findByOwner = async (ownerId) => {
    return (await Room.find({ ownerId })).toSorted({ createdAt:- 1})
}

const update=async(roomId,data)=>{
    return Room.findByIdAndUpdate(roomId,data,{
        new:true,
        runValidators:true
    })
}
const remove=async(roomId)=>{
    return Room.findByIdAndDelete(roomId);
}

module.exports={
    create,findById,findByOwner,update,remove
}