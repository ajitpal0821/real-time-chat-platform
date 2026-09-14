const { success } = require("zod");

const errorHandler=(err,req,res,next)=>{
    console.error(err);

    if(err.code===11000){
          const duplicateField = Object.keys(err.keyValue || {})[0];
        return res.status(409).json({
            success:false,
            error:{
                code:"DUPLICATE_RESOURCE",
                message:`${duplicateField} already exists`
            }
        })
    }
    if (err.name === "CastError") {

        return res.status(400).json({
            success: false,
            error: {
                code: "INVALID_ID",
                message: "Invalid resource ID"
            }
        });
    }

    // Mongoose validation error
    if (err.name === "ValidationError") {

        return res.status(400).json({
            success: false,
            error: {
                code: "DATABASE_VALIDATION_ERROR",
                message: "Invalid data",
                details: Object.values(err.errors).map((error) => ({
                    field: error.path,
                    message: error.message
                }))
            }
        });
    }
    const statusCode=err.statusCode || 500;
    res.status(statusCode).json({
        success:false,
        error:{
            code:err.code || "500",
            message:err.message || "INTERNAL SERVER ERROR"
        }
    })
}

module.exports=errorHandler;