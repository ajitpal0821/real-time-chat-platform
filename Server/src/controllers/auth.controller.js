const authService=require('../services/auth.service');
const {sendSuccessResponse}=require('../utils/response');

const register=async(req,res,next)=>{
    try{
        const user=await authService.register(req.body);

        return sendSuccessResponse(res,user,201,"User registered successfully");

    }
    catch(error){
        next(error);
    }
}

const login=async(req,res,next)=>{
     try{
        const user=await authService.login(req.body);

        return sendSuccessResponse(res,user,200,"Login successfull");

    }
    catch(error){
        next(error);
    }
}
module.exports={register,login}
