const adminRepository = require("../repositories/admin.repository");

const ALLOWED_APPLICATION_STATUSES = ["PENDING", "APPROVED", "REJECTED"];

function createServiceError(message, statusCode, code){
    const error = new Error(message);
    error.statusCode = statusCode;
    error.code = code;
    return error;
}

async function getDriverApplications(applicationStatus = "PENDING"){
    if(!ALLOWED_APPLICATION_STATUSES.includes(applicationStatus)) {
        throw createServiceError(
            "Invalid driver application status.",
            400,
            "INVALID_APPLICATION_STATUS"
        );
    }

    return adminRepository.findDriverApplications(applicationStatus);
}

async function getDriverApplicationById(driverUserId) {
    if(!Number.isInteger(driverUserId) || driverUserId <= 0) {
        throw createServiceError(
            "Invalid driver user ID.",
            400,
            "INVALID_DRIVER_ID"
        );
    }
    const application = await adminRepository.findDriverApplicationById(driverUserId);

    if(!application) {
        throw createServiceError(
            "Driver application not found.",
            404,
            "DRIVER_APPLICATION_NOT_FOUND"
        );
    }

    return application;
}

async function reviewDriverApplication(driverUserId, applicationStatus){
    if(!Number.isInteger(driverUserId) || driverUserId <= 0){
        throw createServiceError(
            "Invalid driver user ID.",
            400,
            "INVALID_DRIVER_ID"
        );
    }

    if(!["APPROVED", "REJECTED"].includes(applicationStatus)) {
        throw createServiceError(
            "Application status must be APPROVED or REJECTED.",
            400,
            "INVALID_REVIEW_STATUS"
        );
    }

    const application = await adminRepository.findDriverApplicationById(driverUserId);

    if(!application) {
        throw createServiceError(
            "Driver application not found.",
            404,
            "DRIVER_APPLICATION_NOT_FOUND"
        );
    }

    if(application.application_status !== "PENDING") {
        throw createServiceError(
            "Only pending application can be reviewed.",
            409,
            "APPLICATION_ALREADY_REVIEWED"
        );
    }

    const result = await adminRepository.updateDriverApplicationStatus(driverUserId, applicationStatus);

    if(result.affectedRows === 0){
        throw createServiceError(
            "This application has already been reviewed.",
            409,
            "APPLICATION_ALREADY_REVIEWED"
        );
    }
    return adminRepository.findDriverApplicationById(driverUserId);
}

module.exports = {
    getDriverApplications,
    getDriverApplicationById,
    reviewDriverApplication
};
