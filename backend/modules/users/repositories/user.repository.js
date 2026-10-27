const db = require("../../../config/db");

function findProfileByUserId(userId){
    return new Promise((resolve, reject) => {
        const sql = `SELECT user_id, name, email, phone, created_at
                    FROM \`USER\`
                    WHERE user_id = ?
                    LIMIT 1`;

        db.query(sql, [userId], (error, results) => {
            if(error)
                return reject(error);

            resolve(results.length > 0 ? results[0] : null);
        });
    });
}

function updateProfile(userId, profileData) {
    return new Promise((resolve, reject) => {
        const sql = `UPDATE \`USER\`
                    SET name = ?, email = ?, phone = ?
                    WHERE user_id = ?`;

        const values = [profileData.name, profileData.email, profileData.phone, userId];

        db.query(sql, values, (error, results) => {
            if(error) return reject(error);
            resolve(results);
        });
    });
}

module.exports = {
    findProfileByUserId,
    updateProfile
}
