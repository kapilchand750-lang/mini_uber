const Joi = require("joi");

const vehicleSchema = Joi.object({
    vehicleTypeId: Joi.number().integer().positive().required(),

    registrationNumber: Joi.string().trim().min(3).max(30)
                .pattern(/^[A-Za-z0-9 -]+$/).required()
                .messages({
                    "string.pattern.base":
                            "Registration number can contain only letters, numbers, spaces, and hyphens."
                }),

    model: Joi.string().trim().min(1).max(100).required()
});

function validateVehicle(req, res, next){
    const { error, value } = vehicleSchema.validate(req.body,  {
        abortEarly:  false,
        stripUnknown: true,
        convert: true
    });

    if(error) {
        return res.status(400).json({
            success: false,
            code: "VALIDATION_ERROR",
            message: "Invalid vehicle data.",
            errors: error.details.map((detail) => detail.message)
        });
    }

    req.body = value;
    next();
}

module.exports = {validateVehicle};

