const db = require("../config/db");
function requireAdmin(req, res, next) {
    const sql = `SELECT role
                FROM \`USER\`
                WHERE user_id = ?
                LIMIT 1`;
    
    db.query(sql, [req.user.user_id], (error, results) => {
        if(error) {
            console.error("Admin authorization database error : ", error);

            return res.status(500).json({
                success: false,
                error: {
                    code: "AUTHORIZATION_CHECK_FAILED",
                    message: "Unable to verify permissions."
                }
            });
        }

        if(results.length === 0) {
            return res.status(401).json({
                success: false,
                error: {
                    code: "USER_NOT_FOUND",
                    message: "Authenticated user no longer exists."
                }
            });
        }

        if(results[0].role !== "ADMIN"){
            return res.status(403).json({
                success: false,
                error: {
                    code: "ADMIN_ACCESS_REQUIRED",
                    message: "Administrator access is required."
                }
            });
        }
        next();
    });
}

module.exports = {
    requireAdmin
};