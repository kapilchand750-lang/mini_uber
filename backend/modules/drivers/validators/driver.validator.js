const Joi = require("Joi");

const applyForDriverSchema = Joi.object({
    license_number: Joi.string().trim().min(1).max(50).required().messages({
                    "string.empty" : "License number is required.",
                    "string.max" : "License number cannot exceed 50 characters.",
                    "any.required": "License number is required."
    })
}).unknown(false);

function validateDriverApplication(req, res, next) {
    const {error, value} = applyForDriverSchema.validate(req.body, {
        abortEarly: false,
        stripUnknwon: false
    });

    if(error) {
        return res.status(400).json({
            success:false,
            error: {
                code: "VALIDATION_ERROR",
                message: "Invalid driver application details.",
                details: error.details.map((detail) => ({
                    field: detail.path.join("."),
                    message: detail.message
                }))
            }
        });
    }

    req.body = value;
    next();
}

module.exports = {
    validateDriverApplication
};