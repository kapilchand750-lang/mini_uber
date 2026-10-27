function successResponse(res, statusCode, message, data) {
    return res.status(statusCode).json({
        success: true,
        message,
        data
    });
}

function errorResponse(res, statusCode, code, message){
    return res.status(statusCode).json({
        success: false,
        error: {
            code,
            message
        }
    });
}

module.exports = {
    successResponse,
    errorResponse
};