const sendSuccessResponse = (res, data, statusCode = 200, message) => {
    const response = {
        success: true,
    }
    if (message) {
        response.message = message;
    }
    response.data=data;
    return res.status(statusCode).json({
        response
    })
};

module.exports = { sendSuccessResponse };