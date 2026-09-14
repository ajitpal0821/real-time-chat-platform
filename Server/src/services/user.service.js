
const AppError = require('../utils/AppError.js')
const userRepository = require('../repositories/user.repository.js');

const createUser = async (userData) => {

    if (!userData.name) {
        throw new Error("Name is Required");
    }

    if (!userData.email) {
        throw new Error("Email is required")
    }
    const user = await userRepository.create(userData);

    return user;
}
const getAllUsers = async () => {
    return await userRepository.findAll();
}

const getUserById = async (id) => {
    const user = await userRepository.findById(id);
    if (!user) {
        throw new AppError(
            "User not found",
            404,
            "USER_NOT_FOUND"
        );
    }
    return user;
}

const updateUser = async (id, userData) => {
    // try {
        const user=await userRepository.update(id,data);
        if(!user){
            throw new AppError(
                "User not found",
                404,
                "USER_NOT_FOUND"
            );
        }
        return user;
    // } catch (err) {
    //         next(err);
    // }
}



module.exports = { createUser, getAllUsers, getUserById,updateUser }