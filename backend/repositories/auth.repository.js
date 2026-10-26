
const db = require("../config/db");

function findByUsername(username) {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT
                u.user_id,
                u.name,
                u.email,
                u.phone,
                uc.username,
                uc.password_hash
            FROM USER_CREDENTIAL uc
            INNER JOIN \`USER\` u
                ON uc.user_id = u.user_id
            WHERE uc.username = ?
            LIMIT 1
        `;

        db.query(sql, [username], (error, results) => {
            if (error) {
                return reject(error);
            }

            resolve(results.length > 0 ? results[0] : null);
        });
    });
}

function findByUserId(userId) {
    return new Promise((resolve, reject) => {
        const sql = `SELECT u.user_id, u.name, u.email, u.phone,
                        uc.username
                        FROM USER_CREDENTIAL uc
                        INNER JOIN \`USER\` u
                        ON uc.user_id = u.user_id
                        WHERE u.user_id = ?
                        LIMIT 1`;
        
        db.query(sql, [userId], (error, results) => {
            if(error) return reject(error);

            resolve(results.length>0 ? results[0] : null);
        });
    });
}

module.exports = {
    findByUsername,
    findByUserId
};
