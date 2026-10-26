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

module.exports = {
    findProfileByUserId
}
