const db = require("../../../config/db");

function createVehicle(driverUserId, vehicleTypeId, registrationNumber, model){
    return new Promise((resolve, reject) =>  {
        const sql = `INSERT INTO VEHICLE
                        (driver_user_id, vehicle_type_id, registration_number, model)
                            VALUES(?, ?, ?, ?)`;

        db.query(sql, [driverUserId, vehicleTypeId, registrationNumber, model], (error, results) => {
            if(error) return reject(error);
            resolve(results);
        });
    });
}

function findAllByDriverId(driverUserId) {
    return new Promise((resolve, reject) => {
        const sql = `SELECT 
                        v.vehicle_id, v.driver_user_id, v.vehicle_type_id,
                        vt.type_name, v.registration_number, v.model
                    FROM VEHICLE AS v
                    INNER JOIN VEHICLE_TYPE AS vt
                        ON v.vehicle_type_id = vt.vehicle_type_id
                    WHERE v.driver_user_id = ?
                    ORDER BY v.vehicle_id DESC`;

        db.query(sql, [driverUserId], (error, results) => {
            if(error) return reject(error);
            resolve(results);
        });
    });
}

function findByIdAndDriverId(vehicleId, driverUserId) {
    return new Promise((resolve, reject) => {
        const sql =`SELECT 
                        v.vehicle_id, v.driver_user_id, v.vehicle_type_id,
                        vt.type_name, v.registration_number, v.model
                    FROM VEHICLE AS v
                    INNER JOIN VEHICLE_TYPE AS vt
                        ON v.vehicle_type_id = vt.vehicle_type_id
                    WHERE v.vehicle_id = ?
                        AND v.driver_user_id = ?
                    LIMIT 1`;
        
        db.query(sql, [vehicleId, driverUserId], (error, results) => {
            if(error) return reject(error);
            resolve(results.length > 0 ? results[0] : null);
        });
    });
}

function updateVehicle(vehicleId, driverUserId, vehicleTypeId, registrationNumber, model) {
    return new Promise((resolve, reject) => {
        const sql = `UPDATE VEHICLE
                     SET vehicle_type_id = ?, registration_number = ?, model = ?
                     WHERE vehicle_id = ?
                     AND driver_user_id = ?`;
        
        db.query(sql, [vehicleTypeId, registrationNumber, model, vehicleId, driverUserId], (error, results) => {
            if (error) return reject(error);
            resolve(results);
        });
    });
}

function deleteVehicle(vehicleId, driverUserId){
    return new Promise((resolve, reject) => {
        const sql = `DELETE FROM VEHICLE
                    WHERE vehicle_id = ? 
                        AND driver_user_id = ?`;
        
        db.query(sql, [vehicleId, driverUserId], (error, results) => {
            if(error) reject(error);
            resolve(results);
        });
    });
}

function findVehicleTypeById(vehicleTypeId){
    return new Promise((resolve, reject)  => {
        const sql = `SELECT vehicle_type_id, type_name
                    FROM VEHICLE_TYPE
                    WHERE vehicle_type_id = ?
                    LIMIT 1`;

        db.query(sql, [vehicleTypeId], (error, results) => {
            if(error) return reject(error);
            resolve(results.length > 0 ? results[0] : null);
        });
    });
}

function findDriverApplicationStatus(driverUserId) {
    return new Promise((resolve, reject) => {
        const sql = `SELECT application_status
                    FROM DRIVER
                    WHERE user_id = ?
                    LIMIT 1`;
        
        db.query(sql, [driverUserId], (error, results) => {
            if(error) return reject(error);
            resolve(results.length > 0 ? results[0].application_status : null);
        });
    });
}

module.exports = {
    createVehicle,
    findAllByDriverId,
    findByIdAndDriverId,
    updateVehicle,
    deleteVehicle,
    findVehicleTypeById,
    findDriverApplicationStatus
};