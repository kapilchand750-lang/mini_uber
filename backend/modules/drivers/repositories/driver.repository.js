const db = require("../../../config/db");

function findByUserId(userId) {
    return new Promise((resolve, reject) => {
        const sql = `SELECT u.user_id, u.name, u.email, u.phone, u.created_at,
                        d.license_number, d.status
                    FROM \`USER\` AS u
                    INNER JOIN DRIVER AS d
                    ON u.user_id = d.user_id
                    WHERE u.user_id = ?
                    LIMIT 1`;

        db.query(sql, [userId], (error, results) => {
            if(error) return reject(error);
            resolve(results.length > 0 ? results[0] : null);
        });
    });
}

function createDriver(userId, licenseNumber) {
    return new Promise((resolve, reject) => {
        const sql = `INSERT INTO DRIVER
                        (user_id, license_number)
                        VALUES(?, ?)`;

        db.query(sql, [userId, licenseNumber], (error, results) => {
            if(error) return reject(error);

            resolve(results);
        });
    });
}

module.exports = {
    findByUserId,
    createDriver
};
