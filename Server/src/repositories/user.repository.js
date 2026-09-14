const User=require('../models/user.model');
const users=[];

const create=async(userData)=>{
    return User.create(userData);
}

const findAll=async()=>{
    return User.find();
}
const findById=async(id)=>{
    return User.findById(id);
}

const update=async(id,data)=>{
    return User.findByIdAndUpdate(id,data,{
        new:true,
        runValidators:true
    })
}
module.exports={create, findAll, findById,update}