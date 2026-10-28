const vehicleRepository = require("../repositories/vehicle.repository");

async function ensureDriverCanManageVehicles(driverUserId) {
    const applicationStatus = await vehicleRepository.findDriverApplicationStatus(driverUserId);

    if(!applicationStatus) {
        const error = new Error("Driver application not found");
        error.statusCode = 403,
        error.code = "DRIVER_APPLICATION_NOT_FOUND";
        throw error; 
    }

    if(applicationStatus !== "APPROVED") {
        const error = new Error(
            "Your driver account must be approved before managing vehicles."
        );
        error.statusCode = 403;
        error.code = "DRIVER_NOT_APPROVED";
        throw error;
    }
}

async function registerVehicle(driverUserId, vehicleData) {
    await ensureDriverCanManageVehicles(driverUserId);

    const {vehicleTypeId, registrationNumber, model} = vehicleData;

    const vehicleType = await vehicleRepository.findVehicleTypeById(vehicleTypeId);

    if(!vehicleType) {
        const error = new Error("Vehicle type does not exist.");
        error.statusCode = 400;
        error.code = "INVALID_VEHICLE_TYPE";
        throw error;
    }

    const result = await vehicleRepository.createVehicle(driverUserId, vehicleTypeId, registrationNumber, model);

    return vehicleRepository.findByIdAndDriverId(result.insertId, driverUserId);
    
}

async function getMyVehicles(driverUserId) {
    await ensureDriverCanManageVehicles(driverUserId);

    return vehicleRepository.findAllByDriverId(driverUserId);
}

async function getMyVehicleById(vehicleId, driverUserId) {
    await ensureDriverCanManageVehicles(driverUserId);

    const vehicle = await vehicleRepository.findByIdAndDriverId(vehicleId, driverUserId);

    if(!vehicle) {
        const error = new Error("Vehicle not found.");
        error.statusCode = 404;
        error.code = "VEHICLE_NOT_FOUND";
        throw error;
    }

    return vehicle;
}

async function updateMyVehicle(vehicleId, driverUserId, vehicleData) {
    await ensureDriverCanManageVehicles(driverUserId);

    const existingVehicle = await vehicleRepository.findByIdAndDriverId(vehicleId, driverUserId);

    if(!existingVehicle) {
        const error = new Error("Vehicle not found");
        error.statusCode = 404;
        error.code = "VEHICLE_NOT_FOUND";
        throw error;
    }

    const {vehicleTypeId, registrationNumber, model} = vehicleData;

    const vehicleType = await vehicleRepository.findVehicleTypeById(vehicleTypeId);

    if(!vehicleType) {
        const error = new Error("Vehicle type does not exist.");
        error.statusCode = 400,
        error.code = "INVALID_VEHICLE_TYPE";
        throw error;
    }

    await vehicleRepository.updateVehicle(vehicleId, driverUserId, vehicleTypeId, registrationNumber, model);

    return vehicleRepository.findByIdAndDriverId(vehicleId, driverUserId);
}

async function deleteMyVehicle(vehicleId, driverUserId) {
    await ensureDriverCanManageVehicles(driverUserId);

    const existingVehicle = await vehicleRepository.findByIdAndDriverId(vehicleId, driverUserId);

    if(!existingVehicle){
        const error = new Error("Vehicle not found");
        error.statusCode = 404;
        error.code = "VEHICLE_NOT_FOUND";
        throw error;
    }

    await vehicleRepository.deleteVehicle(vehicleId, driverUserId);
}

module.exports = {
    registerVehicle,
    getMyVehicles,
    getMyVehicleById,
    updateMyVehicle,
    deleteMyVehicle
};

