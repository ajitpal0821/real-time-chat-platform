const User = require('../models/user.model')
const findEmail = async (email) => {
    return User.findOne({ email }).select("+passwordHash");
}

const createUser =async(data)=>{
    return User.create(data);
}

module.exports={findEmail,createUser}