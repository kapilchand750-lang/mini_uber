const driverRepository = require("../repositories/driver.repository");

async function getProfile(userId) {
    const driver = await driverRepository.findByUserId(userId);

    if(!driver) {
        const error = new Error("Driver profile not found.");
        error.statusCode = 404;
        error.code = "DRIVER_NOT_FOUND";
        throw error;
    }

    return driver;
}

async function applyForDriver(userId, licenseNumber){
    const existingDriver = await driverRepository.findByUserId(userId);

    if(existingDriver){
        const error = new Error("Driver application already exists");
        error.statusCode = 409;
        error.code = "DRIVER_APPLICATION_EXISTS";
        throw error;
    }

    await driverRepository.createDriver(userId, licenseNumber);

    return await driverRepository.findByUserId(userId);
}

module.exports = {
    getProfile,
    applyForDriver
};