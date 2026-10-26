const Joi = require("joi");

const registerSchema = Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),

    email: Joi.string().trim().email().max(255).required(),

    phone: Joi.string().pattern(/^[0-9]{10,15}$/).required()
            .messages({"string.pattern.base" : "Phone must contain 10 digits." }),

    username: Joi.string().trim().alphanum().min(5).max(30).required(),

    password: Joi.string().min(12).max(128).required()
});

const loginSchema = Joi.object({
    username: Joi.string()
        .trim().required(),

    password : Joi.string().max(128).required()
});

function validateRegister(req, res, next) {
    const {error, value } = registerSchema.validate(req.body, {
        abortEarly : false,
        stripUnknown: true
    });

    if(error) {
        return res.status(400).json({
            error : {
                code : "VALIDATION_ERROR",
                message : "Invalid registration details.",
                details : error.details.map(detail =>({
                    field : detail.path.join("."),
                    message: detail.message
                }))
            }
        });
    }
    req.body = value;
    next();
}

function validateLogin(req, res, next) {
    const { error, value } = loginSchema.validate(req.body, {
        abortEarly : false,
        stripUnknown : true
    });

    if(error){
        return res.status(400).json({
            error: {
                code: "VALIDATION_ERROR",
                message: "Invalid login details.",
                details: error.details.map(detail => ({
                    field : detail.path.join("."),
                    message : detail.message
                }))
            }
        });
    }
    req.body = value;
    next();
}

module.exports = {
    validateRegister,
    validateLogin
};