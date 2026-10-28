const driverService = require("../services/driver.service");
const {successResponse, errorResponse} = require("../utils/driver-response.util");
async function getProfile(req, res){
    try{
        const userId = req.user.user_id;
        const profile = await driverService.getProfile(userId);

        const {user_id, name, email, phone, created_at, license_number, status} = profile;

        return successResponse(res, 200,
                                "Driver profile retrieved successfully.",
                                {
                                    user: {
                                    user_id, name, email, phone, created_at
                                },
                                    driver: {
                                    license_number, status
                                }
            }
        );
    } catch (error) {
        if(error.code === "DRIVER_NOT_FOUND") {
            return errorResponse(res, 404,
                                    "DRIVER_NOT_FOUND",
                                    "Driver profile not found."
            );
        }

        console.error("Get driver profile error:", error.message);

        return errorResponse(res, 500,
                            "DRIVER_PROFILE_FETCH_FAILED",
                            "Unable to retrieve driver profile at this time."
                        );
    }
}

async function applyForDriver(req, res) {
    try {
        const userId = req.user.user_id;
        const { license_number } = req.body;

        const driver = await driverService.applyForDriver(userId, license_number);

        return successResponse(res, 201,
                                "Driver application submitted successfully.",
                                {
                                    driver: {
                                    user_id: driver.user_id,
                                    license_number: driver.license_number,
                                    status: driver.status
                                    }
                                }
        );
    } catch (error) {
        if (error.code === "DRIVER_APPLICATION_EXISTS") {
            return errorResponse(res, 409,
                "DRIVER_APPLICATION_EXISTS",
                "A driver application already exists for this user."
            );
        }

        if (error.code === "ER_DUP_ENTRY") {
            return errorResponse(res, 409,
                "LICENSE_NUMBER_ALREADY_REGISTERED",
                "This license number is already registered."
            );
        }

        console.error("Apply for driver error:", error.message);

        return errorResponse(res, 500,
            "DRIVER_APPLICATION_FAILED",
            "Unable to submit driver application at this time."
        );
    }
}

module.exports = {
    getProfile,
    applyForDriver
}