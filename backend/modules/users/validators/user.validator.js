const Joi = require("joi");

const updateProfileSchema = Joi.object({
    name: Joi.string().trim().min(3).max(100).required(),

    email: Joi.string().trim().email().max(255).required(),

    phone: Joi.string().trim().pattern(/^[0-9]{10,15}$/).required()
                .messages({"string.pattern.base": "Phone must contain 10 to 15 digits."})
}).unknown(false);



function validateUpdateProfile(req, res,next) {
    const {error, value} = updateProfileSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: false
    });

    if(error){
        return res.status(400).json({
            success: false,
            error: {
                code: "VALIDATION_ERROR",
                message: "Invalid profile details.",
                details: error.details.map((detail) =>({
                    field: detail.path.join("."),
                    message: detail.message
                }))
            }
        });
    }

    req.body = value;
    next();
}

module.exports = {validateUpdateProfile};