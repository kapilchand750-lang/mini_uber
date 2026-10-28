const vehicleService = require("../services/vehicle.service");

function handleError(res, error) {
    console.error("Vehicle controller error : ", error);

    if(error.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
            success:false,
            code: "DUPLICATE_REGISTRATION_NUMBER",
            message: "A vehicle with this registration number already exists."
        });
    }

    if(error.code === "INVALID_VEHICLE_TYPE"){
        return res.status(400).json({
            success: false,
            code: error.code,
            message: error.message
        });
    }

    if(error.code === "VEHICLE_NOT_FOUND"){
        return res.status(404).json({
            success: false,
            code: error.code,
            messsage: error.message
        });
    }

    if(error.code === "DRIVER_NOT_APPROVED" ||
            error.code === "DRIVER_APPLICATION_NOT_FOUND"
        ){
            return res.status(403).json({
                success: false,
                code: error.code,
                message: error.message
            });
        }

    return res.status(500).json({
        success: false,
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred."
    });
}

async function register(req, res) {
    try {
        const vehicle = await vehicleService.registerVehicle(
            req.user.user_id,
            req.body
        );

        return res.status(201).json({
            success: true,
            message: "Vehicle registered successfully.",
            data: vehicle
        });
    } catch (error) {return handleError(res, error);}
}

async function getMyVehicles(req, res) {
    try {
        const vehicles = await vehicleService.getMyVehicles(req.user.user_id);

        return res.status(200).json({
            success: true,
            data: vehicles
        });
    } catch(error) { return handleError (res, error);}
}

async function getMyVehicle(req, res) {
    try{
        const vehicle = await vehicleService.getMyVehicleById(
            Number(req.params.vehicleId),
            req.user.user_id
        );

        return res.status(200).json({
            success: true,
            data: vehicle
        });
    } catch(error) {
        return handleError(res, error);
    }
}

async function update(req, res){
    try {
        const vehicle = await vehicleService.updateMyVehicle(
            Number(req.params.vehicleId),
            req.user.user_id,
            req.body
        )

        return res.status(200).json({
            success: true,
            message: "Vehicle updated successfully.",
            data: vehicle
        });
    } catch(error) { return handleError(res, error);}
}

async function remove(req, res){
    try {
        await vehicleService.deleteMyVehicle(
            Number(req.params.vehicleId),
            req.user.user_id
        );

        return res.status(200).json({
            success: true,
            message: "Vehicle deleted successfully."
        });
    } catch(error) {
        return handleError(res, error);
    }
}

module.exports = {
    register,
    getMyVehicles,
    getMyVehicle,
    update,
    remove
}