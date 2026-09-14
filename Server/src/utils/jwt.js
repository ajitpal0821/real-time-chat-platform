const jwt=require('jsonwebtoken');

const generateAccessToken=(user)=>{
    return jwt.sign(
        {
            userId:user._id.toString()
        },
        process.env.JWT_ACCESS_SECRET,
        {
            expiresIn:"59m"
        }
    );
};

const generateRefreshToken=(user)=>{
    return jwt.sign(
        {
            userId:user._id.toString()
        },
        process.env.JWT_REFRESH_SECRET,
        {
            expiresIn:"7d"
        }
    );
};

const verifyAccessToken=(token)=>{
    return jwt.verify(token,process.env.JWT_ACCESS_SECRET)
}

const verifyRefreshToken=(token)=>{
    return jwt.verify(token,process.env.JWT_REFRESH_SECRET)
}

module.exports={generateAccessToken,generateRefreshToken,verifyAccessToken,verifyRefreshToken}
