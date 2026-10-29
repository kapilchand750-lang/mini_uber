const db = require("../../../config/db");

function findDriverApplications(applicationStatus) {
    return new Promise((resolve, reject) => {
        const sql = `SELECT d.user_id, u.name, u.email, u.phone,
                    d.license_number, d.status, d.application_status
                    FROM DRIVER AS d
                    INNER JOIN \`USER\` AS u
                        ON u.user_id = d.user_id
                        WHERE d.application_status = ?
                        ORDER BY d.user_id ASC`;

        db.query(sql, [applicationStatus], (error, results) => {
            if(error) return reject(error);
            resolve(results);
        });
    });
}

function findDriverApplicationById(driverUserId) {
    return new Promise((resolve, reject) => {
        const sql = `SELECT d.user_id, u.name, u.email,
                    u.phone, d.license_number, d.status, d.application_status
                    FROM DRIVER AS d
                    INNER JOIN USER AS U
                        ON u.user_id = d.user_id
                    WHERE d.user_id = ?
                    LIMIT 1`;

        db.query(sql, [driverUserId], (error, results) => {
            if(error) return reject(error);
            resolve(results.length > 0 ? results[0] : null);
        });
    });
}

function updateDriverApplicationStatus(driverUserId, applicationStatus){
    return new Promise((resolve, reject) => {
        const sql = `UPDATE DRIVER
                    SET application_status = ?
                    WHERE user_id = ?
                        AND application_status = 'PENDING'`;

        db.query(sql, [applicationStatus, driverUserId], (error, results) => {
            if(error) return reject(error);
            resolve(results);
        });
    });
}

module.exports = {
    findDriverApplications,
    findDriverApplicationById,
    updateDriverApplicationStatus
};
